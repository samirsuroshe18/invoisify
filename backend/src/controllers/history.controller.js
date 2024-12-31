

import History from '../models/historyModel';

const getHistory = async (req, res) => {
    try {
        
        const history = await History.find();

        if (history.length === 0) {
            return res.status(404).json({ message: 'No history found' });
        }

        res.status(200).json({ history });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getHistory,
};
