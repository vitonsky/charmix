import path from 'path';

import { app } from './cli';

const rootDir = path.resolve(path.dirname(__filename));
const cacheDir = path.join(rootDir, '.cache');

app({ cacheDir });
