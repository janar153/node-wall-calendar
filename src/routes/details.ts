const express = require('express');
const router = express.Router();

router.get('/:eventID', (req: any, res: any) => {
    res.send('Detaisl view for event with ID: ', req.params.eventID);
});

module.exports = router;