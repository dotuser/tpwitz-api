const express = require('express');
const Visitor = require('../models/Visitor');
const upload = require('../config/upload');
const path = require('path');
const fs = require('fs');
const router = express.Router();

router.post('/', upload.single('cv'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send({ message: 'No file provided' });
        }

        const visitor = new Visitor({
            ...req.body,
        });
        const savedVisitor = await visitor.save();

        const filename = `${req.body.fullName}_${savedVisitor._id}.pdf`;
        const filePath = path.join(__dirname, 'uploads', filename);
        fs.writeFileSync(filePath, req.file.buffer);

        savedVisitor.cv = filename;
        await savedVisitor.save();

        res.status(201).send(savedVisitor);
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

// Read all visitors
router.get('/', async (req, res) => {
    try {
        const visitors = await Visitor.find().select('-__v');
        res.status(200).send(visitors);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// Read a specific visitor by ID
router.get('/:id', async (req, res) => {
    try {
        const visitor = await Visitor.findById(req.params.id).select('-__v');
        if (!visitor) {
            return res.status(404).send({ message: 'Visitor not found' });
        }
        res.status(200).send(visitor);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

router.get('/:id/cv', async (req, res) => {
    try {
        const visitor = await Visitor.findById(req.params.id);
        if (!visitor) {
            return res.status(404).send({ message: 'Visitor not found' });
        }
        const filePath = path.join(__dirname, 'uploads', visitor.cv);
        res.set("Content-Disposition", `attachment; filename="${visitor.cv}"`);
        res.set("Content-Type", 'application/pdf');
        res.sendFile(filePath);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// Update visitor with CV upload
router.put('/:id', upload.single('cv'), async (req, res) => {
    try {
        const visitor = await Visitor.findById(req.params.id);
        if (visitor.cv) {
            const filePath = path.join(__dirname, 'uploads', visitor.cv);
            fs.unlinkSync(filePath); // Delete existing CV file
        }
        const filename = `${req.body.fullName}_${req.params.id}.pdf`;
        const filePath = path.join(__dirname, 'uploads', filename);
        fs.writeFileSync(filePath, req.file.buffer);
        const updatedVisitor = await Visitor.findByIdAndUpdate(req.params.id, {
            ...req.body,
            cv: filename,
        }, { new: true });
        if (!updatedVisitor) {
            return res.status(404).send({ message: 'Visitor not found' });
        }
        res.status(200).send(updatedVisitor);
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

// Delete a visitor by ID
router.delete('/:id', async (req, res) => {
    try {
        const visitor = await Visitor.findByIdAndDelete(req.params.id);
        if (visitor.cv) {
            const filePath = path.join(__dirname, 'uploads', visitor.cv);
            fs.unlinkSync(filePath); // Delete CV file
        }
        if (!visitor) {
            return res.status(404).send({ message: 'Visitor not found' });
        }
        res.status(200).send({ message: 'Visitor deleted successfully' });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

module.exports = router;