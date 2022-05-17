import { nanoid } from 'nanoid';

export default function(name?) {
  const id = nanoid();
  if (!name) return id;
  try {
    return `${name}-${id}`;
  } catch (err) {
    return id;
  }
}
