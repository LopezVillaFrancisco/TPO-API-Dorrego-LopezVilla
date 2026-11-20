import { useEffect, useState } from 'react';
import { authApi } from '../api';

export default function useRegistrationOpen() {
  const [open, setOpen] = useState(null);

  useEffect(() => {
    let active = true;
    authApi
      .registrationStatus()
      .then((status) => active && setOpen(status.open))
      .catch(() => active && setOpen(false));
    return () => {
      active = false;
    };
  }, []);

  return open;
}
