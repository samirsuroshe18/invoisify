import { User } from '../models/user.model.js';

// Ends every session of a user: access tokens issued so far stop being accepted
// and the refresh token is forgotten. Used on logout and after a password reset.
const endSessions = async (userId) => {
    await User.updateOne(
        { _id: userId },
        { $inc: { tokenVersion: 1 }, $unset: { refreshToken: 1 } }
    );
};

export { endSessions }
