import { memo, useCallback, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { animate, motion, motionValue, useMotionValue } from 'framer-motion';
import useElementSize from '../../hooks/useElementSize';
import { gesture, recentlyPanned } from './gesture';

const SPRING = { type: 'spring', stiffness: 320, damping: 36, mass: 0.8, restDelta: 0.5, restSpeed: 10 };
const INSTANT = { duration: 0 };
const prefersReducedMotion = () =>
  typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
const slideTransition = () => (prefersReducedMotion() ? INSTANT : SPRING);
const LOCK_DISTANCE = 10;
const AXIS_RATIO = 1.2;
const SWIPE_RATIO = 0.18;
const SWIPE_VELOCITY = 450;
const EDGE_RESISTANCE = 0.25;
const WHEEL_COOLDOWN = 450;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const wrap = (value, length) => ((value % length) + length) % length;

const findFilled = (columns, from, direction) => {
  for (let step = 1; step <= columns.length; step += 1) {
    const index = wrap(from + direction * step, columns.length);
    if (columns[index].items.length > 0) return index;
  }
  return -1;
};

const Column = memo(function Column({
  column,
  before,
  after,
  position,
  activeIndex,
  height,
  y,
  renderSlide,
  renderEmpty,
  isNear,
  ghost,
}) {
  const mounted = useRef(false);

  useEffect(() => {
    if (ghost || !height) return undefined;
    const target = -position * height;
    if (!mounted.current) {
      y.set(target);
      mounted.current = true;
      return undefined;
    }
    if (y.get() === target) return undefined;
    const controls = animate(y, target, slideTransition());
    return () => controls.stop();
  }, [ghost, position, height, y]);

  if (column.items.length === 0) {
    return <div className="h-full w-full">{renderEmpty(column)}</div>;
  }

  const slots = column.items.map((product, index) => ({ key: product.id, slot: index, index, product, column }));
  if (before) slots.unshift({ key: `before-${before.product.id}`, slot: -1, ...before });
  if (after) slots.push({ key: `after-${after.product.id}`, slot: column.items.length, ...after });

  return (
    <motion.div className="absolute inset-x-0 top-0" style={{ y, height: height * column.items.length, willChange: 'transform' }}>
      {slots.map((entry) => {
        const visible = isNear ? Math.abs(entry.slot - position) <= 2 : entry.slot === position;
        return (
          <div key={entry.key} className="absolute inset-x-0" style={{ top: entry.slot * height, height }}>
            {visible &&
              renderSlide(entry.product, {
                index: entry.index,
                total: entry.column.items.length,
                column: entry.column,
                active: entry.slot === activeIndex,
              })}
          </div>
        );
      })}
    </motion.div>
  );
});

export default function FeedStage({
  columns,
  catIndex,
  positions,
  onCategoryChange,
  onProductChange,
  onCross,
  renderSlide,
  renderEmpty,
  disabled,
  stepRef,
}) {
  const containerRef = useRef(null);
  const { width, height } = useElementSize(containerRef);
  const trackX = useMotionValue(0);
  const columnYs = useRef(new Map());
  const lock = useRef(null);
  const lastWheel = useRef(0);
  const trackReady = useRef(false);
  const crossing = useRef(false);

  const count = columns.length;
  const totalItems = columns.reduce((sum, column) => sum + column.items.length, 0);
  const loopX = count > 1;
  const loopY = totalItems > 1;

  const getY = (id) => {
    if (!columnYs.current.has(id)) columnYs.current.set(id, motionValue(0));
    return columnYs.current.get(id);
  };

  const positionOf = (column) => clamp(positions[column.id] || 0, 0, Math.max(column.items.length - 1, 0));

  useEffect(() => {
    if (!width) return undefined;
    const target = -catIndex * width;
    if (!trackReady.current) {
      trackX.set(target);
      trackReady.current = true;
      return undefined;
    }
    if (trackX.get() === target) return undefined;
    const controls = animate(trackX, target, slideTransition());
    return () => controls.stop();
  }, [catIndex, width, trackX]);

  const neighbours = (index) => {
    if (!loopY) return { before: null, after: null };
    const prev = findFilled(columns, index, -1);
    const next = findFilled(columns, index, 1);
    const prevColumn = columns[prev];
    const nextColumn = columns[next];
    return {
      before: prevColumn ? { product: prevColumn.items[prevColumn.items.length - 1], index: prevColumn.items.length - 1, column: prevColumn } : null,
      after: nextColumn ? { product: nextColumn.items[0], index: 0, column: nextColumn } : null,
    };
  };

  const finishCross = (sourceColumn, sourcePosition, destIndex, destPosition) => {
    const dest = columns[destIndex];
    getY(sourceColumn.id).set(-sourcePosition * height);
    getY(dest.id).set(-destPosition * height);
    trackX.set(-destIndex * width);
    flushSync(() => onCross(destIndex, destPosition));
    crossing.current = false;
  };

  const crossY = (direction) => {
    const column = columns[catIndex];
    const current = positionOf(column);
    const destIndex = findFilled(columns, catIndex, direction);
    if (destIndex < 0) return false;
    const destPosition = direction > 0 ? 0 : columns[destIndex].items.length - 1;
    const slot = direction > 0 ? column.items.length : -1;
    crossing.current = true;
    animate(getY(column.id), -slot * height, slideTransition()).then(() => finishCross(column, current, destIndex, destPosition));
    return true;
  };

  const crossX = (direction) => {
    const slot = direction > 0 ? count : -1;
    const destIndex = wrap(slot, count);
    crossing.current = true;
    animate(trackX, -slot * width, slideTransition()).then(() => {
      trackX.set(-destIndex * width);
      flushSync(() => onCategoryChange(destIndex));
      crossing.current = false;
    });
    return true;
  };

  const go = (axis, direction) => {
    if (crossing.current) return false;
    if (axis === 'x') {
      const next = catIndex + direction;
      if (next >= 0 && next < count) {
        onCategoryChange(next);
        return true;
      }
      return loopX ? crossX(direction) : false;
    }
    const column = columns[catIndex];
    if (!column || column.items.length === 0) {
      if (!loopY) return false;
      const destIndex = findFilled(columns, catIndex, direction);
      if (destIndex < 0) return false;
      onCross(destIndex, direction > 0 ? 0 : columns[destIndex].items.length - 1);
      return true;
    }
    const current = positionOf(column);
    const next = current + direction;
    if (next >= 0 && next < column.items.length) {
      onProductChange(column.id, next);
      return true;
    }
    return loopY ? crossY(direction) : false;
  };

  const goRef = useRef(go);
  goRef.current = go;

  const step = useCallback((axis, direction) => goRef.current(axis, direction), []);

  useEffect(() => {
    if (stepRef) stepRef.current = step;
  }, [stepRef, step]);

  useEffect(() => {
    if (disabled) return undefined;
    const keys = { ArrowDown: ['y', 1], ArrowUp: ['y', -1], ArrowRight: ['x', 1], ArrowLeft: ['x', -1] };
    const onKey = (event) => {
      if (!keys[event.key] || ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
      event.preventDefault();
      step(...keys[event.key]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [disabled, step]);

  const onPanStart = () => {
    lock.current = crossing.current ? 'busy' : null;
  };

  const onPan = (event, info) => {
    if (lock.current === 'busy') return;
    const { x, y } = info.offset;
    if (!lock.current) {
      if (Math.abs(x) < LOCK_DISTANCE && Math.abs(y) < LOCK_DISTANCE) return;
      lock.current = Math.abs(x) > Math.abs(y) * AXIS_RATIO ? 'x' : 'y';
    }

    if (lock.current === 'x') {
      const atEdge = !loopX && ((catIndex === 0 && x > 0) || (catIndex === count - 1 && x < 0));
      trackX.set(-catIndex * width + (atEdge ? x * EDGE_RESISTANCE : x));
      return;
    }

    const column = columns[catIndex];
    if (!column || column.items.length === 0) return;
    const position = positionOf(column);
    const atEdge = !loopY && ((position === 0 && y > 0) || (position === column.items.length - 1 && y < 0));
    getY(column.id).set(-position * height + (atEdge ? y * EDGE_RESISTANCE : y));
  };

  const onPanEnd = (event, info) => {
    const axis = lock.current;
    lock.current = null;
    if (!axis || axis === 'busy') return;
    gesture.lastPanEnd = Date.now();

    const offset = axis === 'x' ? info.offset.x : info.offset.y;
    const velocity = axis === 'x' ? info.velocity.x : info.velocity.y;
    const distance = axis === 'x' ? width : height;
    let direction = 0;
    if (offset < -distance * SWIPE_RATIO || velocity < -SWIPE_VELOCITY) direction = 1;
    else if (offset > distance * SWIPE_RATIO || velocity > SWIPE_VELOCITY) direction = -1;

    if (direction !== 0 && go(axis, direction)) return;

    if (axis === 'x') {
      animate(trackX, -catIndex * width, slideTransition());
    } else {
      const column = columns[catIndex];
      if (column) animate(getY(column.id), -positionOf(column) * height, slideTransition());
    }
  };

  const wheelRef = useRef(null);
  wheelRef.current = (event) => {
    if (disabled) return;
    const now = Date.now();
    if (now - lastWheel.current < WHEEL_COOLDOWN) return;
    const { deltaX, deltaY } = event;
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 20) {
      lastWheel.current = now;
      goRef.current('y', Math.sign(deltaY));
    } else if (Math.abs(deltaX) > 20) {
      lastWheel.current = now;
      goRef.current('x', Math.sign(deltaX));
    }
  };

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return undefined;
    const onWheel = (event) => {
      event.preventDefault();
      wheelRef.current(event);
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, []);

  const slots = columns.map((column, index) => ({ key: column.id, slot: index, column, ghost: false }));
  if (loopX) {
    slots.unshift({ key: `ghost-start-${columns[count - 1].id}`, slot: -1, column: columns[count - 1], ghost: true });
    slots.push({ key: `ghost-end-${columns[0].id}`, slot: count, column: columns[0], ghost: true });
  }

  return (
    <motion.div
      ref={containerRef}
      className="absolute inset-0 touch-none overflow-hidden select-none"
      onPanStart={onPanStart}
      onPan={onPan}
      onPanEnd={onPanEnd}
      onClickCapture={(event) => {
        if (recentlyPanned()) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      {width > 0 && height > 0 && (
        <motion.div className="absolute inset-y-0 left-0" style={{ x: trackX, width: width * count, willChange: 'transform' }}>
          {slots.map((entry) => {
            const position = positionOf(entry.column);
            const realIndex = wrap(entry.slot, count);
            const { before, after } = neighbours(realIndex);
            const near = Math.abs(entry.slot - catIndex) <= 1;
            return (
              <div key={entry.key} className="absolute top-0 overflow-hidden" style={{ left: entry.slot * width, width, height }}>
                <Column
                  column={entry.column}
                  before={before}
                  after={after}
                  position={position}
                  activeIndex={entry.ghost || entry.slot !== catIndex ? null : position}
                  height={height}
                  y={getY(entry.column.id)}
                  renderSlide={renderSlide}
                  renderEmpty={renderEmpty}
                  isNear={near}
                  ghost={entry.ghost}
                />
              </div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
