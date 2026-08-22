import { Internal } from './internal/base';
import { roomMethods } from './internal/room';
import { adminMethods } from './internal/admin';
import { mediaMethods } from './internal/media';
import { broadcastMethods } from './internal/broadcast';
import { economyMethods } from './internal/economy';
import { userMethods } from './internal/user';
import { storeMethods } from './internal/store';
import { systemMethods } from './internal/system';

Object.assign(Internal.prototype, roomMethods);
Object.assign(Internal.prototype, adminMethods);
Object.assign(Internal.prototype, mediaMethods);
Object.assign(Internal.prototype, broadcastMethods);
Object.assign(Internal.prototype, economyMethods);
Object.assign(Internal.prototype, userMethods);
Object.assign(Internal.prototype, storeMethods);
Object.assign(Internal.prototype, systemMethods);

export { Internal } from './internal/base';
export type { InternalType } from './internal/types';
