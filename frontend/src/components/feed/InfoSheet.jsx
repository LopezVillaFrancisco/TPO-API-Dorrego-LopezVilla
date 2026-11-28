import { AtSign, Clock, Globe, MapPin, MessageCircle, Phone } from 'lucide-react';
import BottomSheet from '../BottomSheet';
import BusinessLogo from '../BusinessLogo';
import { isValidUrl } from '../../utils/format';

const SOCIALS = {
  instagram: { label: 'Instagram', icon: AtSign },
  facebook: { label: 'Facebook', icon: Globe },
  whatsapp: { label: 'WhatsApp', icon: MessageCircle },
  tiktok: { label: 'TikTok', icon: AtSign },
  web: { label: 'Sitio web', icon: Globe },
};

function InfoRow({ icon: Icon, label, value, href }) {
  if (!value) return null;
  const content = (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-stone-800 text-accent">
        <Icon size={18} />
      </span>
      <span>
        <span className="block text-xs text-stone-500">{label}</span>
        <span className="block text-sm text-stone-200">{value}</span>
      </span>
    </>
  );
  return (
    <li>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-stone-800/60">
          {content}
        </a>
      ) : (
        <div className="flex items-center gap-3 p-2">{content}</div>
      )}
    </li>
  );
}

export function BusinessInfoContent({ business, onContact }) {
  const socials = Object.entries(business?.socialLinks || {}).filter(([, url]) => url && isValidUrl(url));

  return (
    <>
      <div className="flex flex-col items-center pt-2 text-center">
        <BusinessLogo business={business} size="lg" />
        <h2 className="mt-4 font-serif text-3xl break-words">{business?.name}</h2>
        {business?.description && <p className="mt-3 text-sm leading-relaxed text-stone-400">{business.description}</p>}
      </div>

      <ul className="mt-6 space-y-1">
        <InfoRow
          icon={MapPin}
          label="Dirección"
          value={business?.address}
          href={business?.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}` : null}
        />
        <InfoRow icon={Clock} label="Horarios" value={business?.hours} />
        <InfoRow icon={Phone} label="Teléfono" value={business?.phone} href={business?.phone ? `tel:${business.phone.replace(/\s/g, '')}` : null} />
      </ul>

      {socials.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-2">
          {socials.map(([key, url]) => {
            const social = SOCIALS[key] || { label: key, icon: Globe };
            const Icon = social.icon;
            return (
              <a key={key} href={url} target="_blank" rel="noreferrer" className="btn-ghost justify-start">
                <Icon size={16} className="text-accent" />
                {social.label}
              </a>
            );
          })}
        </div>
      )}

      <button type="button" className="btn-primary mt-6 w-full" onClick={onContact}>
        <MessageCircle size={16} /> Hacer una consulta
      </button>
    </>
  );
}

export default function InfoSheet({ open, onClose, business, onContact }) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Información del comercio">
      <BusinessInfoContent business={business} onContact={onContact} />
    </BottomSheet>
  );
}
