import api, { unwrap } from './client.js';

export const getBusiness = async () => unwrap(await api.get('/business')).data.business;

// fields: the form's values; logo: a File, or null; removeLogo: take the stored logo away
export const saveBusiness = async (fields, logo, removeLogo = false) => {
  const body = new FormData();
  Object.entries(fields).forEach(([key, value]) => body.append(key, value ?? ''));
  if (logo) body.append('logo', logo);
  if (removeLogo) body.append('removeLogo', 'true');

  return unwrap(await api.put('/business', body));
};
