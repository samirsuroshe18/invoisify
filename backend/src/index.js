// must stay first: ES imports are hoisted, and the modules below read process.env
import 'dotenv/config';
import connectDB from './database/database.js';
import app from './app.js';
import { startDemo } from './scripts/demoData.js';
import { User } from './models/user.model.js';
import { Business } from './models/business.model.js';
import { Invoice } from './models/invoice.model.js';
import { Counter } from './models/counter.model.js';

const PORT = process.env.PORT || 3004;

connectDB().then(async () => {
    // invoice numbers and accounts rely on unique indexes: they are in place before
    // the first request
    await Promise.all([User.init(), Business.init(), Invoice.init(), Counter.init()]);

    // visitors change the demo account while trying things out; a fresh start puts it back
    if (process.env.SEED_ON_START === 'true') {
        await startDemo();
    }

    app.listen(PORT, process.env.SERVER_HOST, () => {
        console.log(`Server is running on port ${PORT}`);
    })
}).catch((err) => {
    console.log('MongoDB Failed !!!', err);
});
