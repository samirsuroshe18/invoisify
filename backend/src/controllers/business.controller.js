import asyncHandler from '../utils/asynchandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { Business, CURRENCIES, DEFAULT_ACCENT } from '../models/business.model.js';
import { readBoolean, readChoice, readText } from '../utils/input.js';
import { readPercent } from '../utils/totals.js';
import { storeFile } from '../utils/uploads.js';

const NAME_MAX = 120;
const EMAIL_MAX = 254;
const PHONE_MAX = 30;
const ADDRESS_MAX = 300;
const PAYMENT_MAX = 500;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COLOUR_PATTERN = /^#[0-9a-f]{6}$/;

// the profile as the pages and the invoices use it; the same shape before anything was saved
const describe = (business) => ({
    companyName: business?.companyName || '',
    email: business?.email || '',
    phone: business?.phone || '',
    address: business?.address || '',
    logoUrl: business?.logoUrl || '',
    accentColor: business?.accentColor || DEFAULT_ACCENT,
    currency: business?.currency || CURRENCIES[0],
    taxPercent: business?.taxPercent || 0,
    paymentDetails: business?.paymentDetails || '',
    // an invoice needs to say who it is from
    complete: Boolean(business?.companyName),
});

const getBusinessOf = async (userId) => describe(await Business.findOne({ user: userId }));

const readEmail = (value) => {
    const email = readText(value, 'Email', { max: EMAIL_MAX }).toLowerCase();

    if (email && !EMAIL_PATTERN.test(email)) {
        throw new ApiError(400, "Enter a valid email address");
    }

    return email;
};

const readColour = (value) => {
    const colour = readText(value, 'Accent colour').toLowerCase() || DEFAULT_ACCENT;

    if (!COLOUR_PATTERN.test(colour)) {
        throw new ApiError(400, `Accent colour must look like ${DEFAULT_ACCENT}`);
    }

    return colour;
};

const getBusiness = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(200, { business: await getBusinessOf(req.user._id) }, "Business profile")
    );
});

const saveBusiness = asyncHandler(async (req, res) => {
    // only these fields are ever read from the form
    const fields = {
        companyName: readText(req.body.companyName, 'Company name', { max: NAME_MAX, required: true }),
        email: readEmail(req.body.email),
        phone: readText(req.body.phone, 'Phone', { max: PHONE_MAX }),
        address: readText(req.body.address, 'Address', { max: ADDRESS_MAX }),
        accentColor: readColour(req.body.accentColor),
        currency: readChoice(req.body.currency, 'Currency', CURRENCIES) || CURRENCIES[0],
        taxPercent: readPercent(req.body.taxPercent, 'Default tax rate'),
        paymentDetails: readText(req.body.paymentDetails, 'Payment details', { max: PAYMENT_MAX }),
    };

    const changes = { $set: fields };
    let note = '';

    // the logo is stored only now that the fields were accepted
    if (req.file && req.user.isDemo) {
        note = '. Logos are not stored for the demo account.';
    } else if (req.file) {
        const url = await storeFile(req.file, 'logos').catch(() => null);

        if (url) {
            fields.logoUrl = url;
        } else {
            note = ', but the logo could not be stored';
        }
    } else if (readBoolean(req.body.removeLogo)) {
        changes.$unset = { logoUrl: '' };
    }

    const business = await Business.findOneAndUpdate({ user: req.user._id }, changes, { upsert: true, new: true });

    return res.status(200).json(
        new ApiResponse(200, { business: describe(business) }, `Business profile saved${note}`)
    );
});

export { getBusiness, saveBusiness, getBusinessOf }
