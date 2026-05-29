import { z } from 'zod';
const schema = z.object({ name: z.string() });
const result = schema.safeParse({});
const err = (result as any).error;
console.log('has errors?', 'errors' in err);
console.log('has issues?', 'issues' in err);
