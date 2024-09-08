import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { IncomingForm } from "formidable";
import rawBody from 'raw-body'
import path from "path";
import multer from "multer"
import { query } from "./dbConnection";
import fs from 'fs';

export const config = {
    api: {bodyParser: false},
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(process.cwd(), '/public/uploads');
      fs.mkdirSync(uploadPath, { recursive: true });
      cb(null, uploadPath); // Save to 'uploads' directory
    },
    filename: (req, file, cb) => {
      const uniqueName = Date.now() + '-' + file.originalname.replace(/\.mp3$/, '') + path.extname(file.originalname);
      cb(null, uniqueName); // Save with a unique name
    },
});
  
const upload = multer({ storage: storage });



// NEEDS AUTHORIZATION WHEN INTEGRATED

export default async function handler(req, res) {
    if (req.method === 'POST') {                    // used for posting new sounds into sql table
        // Uses multer to parse the incoming file
        upload.single('soundFile')(req, res, async (err) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
    
          const soundName = req.body.soundName;
          const soundFile = req.file;
    
          if (!soundFile) {
            return res.status(400).json({ error: 'No file provided' });
          }
    
          // File path where the file is saved locally
          const filePath = path.join('/uploads', soundFile.filename);
          //const filePath = req.body.filePath
    
          try {
            // Insert the sound data into the database
            const addSound = await query({
              query: 'INSERT INTO sounds (name, path) VALUES (?, ?)',
              values: [soundName, filePath],
            });
    
            if (addSound.insertId) {
              return res.status(200).json({
                message: 'File uploaded and data saved successfully',
                sound: { id: addSound.insertId, name: soundName, path: filePath },
              });
            } else {
              return res.status(500).json({ error: 'Database error' });
            }
        } catch (dbError) {
            return res.status(500).json({ error: dbError.message });
        }
      });
    } 

    if (req.method === 'PUT') {             // used for changing approved variable or changing name
      try {
        const contentType = req.headers['content-type'];    // uses json parsing instead of multer parsing since only one string variable and no files
        let data;

        if (contentType && contentType.includes('application/json')) {
          const rawData = await rawBody(req);
          data = JSON.parse(rawData.toString());
        } else {
          const form = new IncomingForm();
          data = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields) => {
              if (err) return reject(err);
              resolve(fields);
            });
          });
        }

        const numberOfElements = Object.keys(data).length;

        if (numberOfElements == 1) {  // approve sound
          const id = data.id;
          const idNum = Number(id);

          const result = await query({
              query: 'UPDATE sounds SET approved = TRUE WHERE id = ?',
              values: [idNum]
          });
          if (result.affectedRows > 0) {
              res.status(200).json({ message: 'Sound approved successfully' });
          } else {
              res.status(500).json({ message: 'Failed to approve sound in api' });
          }
        }

        else if (numberOfElements == 2) {   // rename sound
          const id = data.id;
          const idNum = Number(id);
          //console.log(typeof id)

          const newName = data.newName;

          const result = await query({
              query: 'UPDATE sounds SET name = ? WHERE id = ?',
              values: [newName, idNum]
          });
          if (result.affectedRows > 0) {
              res.status(200).json({ message: 'Sound renamed successfully' });
          } else {
              res.status(500).json({ message: 'Failed to rename sound' });
          }
        }

        
      } catch (dbError) {
        return res.status(500).json({ error: dbError.message });
      }
    }

    if (req.method === "GET") {           // used for displaying sql table or getting a filepath given a soundName

      const sound = await query({
          query:"select * from sounds",
          values:[]
      });


      res.status(200).json({ sounds: sound});
    }

    if (req.method === 'DELETE') {        // used for deleting sounds from sql table and machine
      try {
        const contentType = req.headers['content-type'];
        let data;
    
        if (contentType && contentType.includes('application/json')) {
          const rawData = await rawBody(req);
          data = JSON.parse(rawData.toString());
        } else {
          const form = new IncomingForm();
          data = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields) => {
              if (err) return reject(err);
              resolve(fields);
            });
          });
        }
    
        const id = Number(data.id);
    
        const sound = await query({
          query: 'SELECT path FROM sounds WHERE id = ?',
          values: [id]
        });
    
        if (sound.length > 0) {
          const filePath = path.join(process.cwd(), 'public', sound[0].path);
          
          // Check if file exists before attempting to delete
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
    
          const result = await query({
            query: 'DELETE FROM sounds WHERE id = ?',
            values: [id]
          });
    
          if (result.affectedRows > 0) {
            res.status(200).json({ message: 'Sound deleted successfully' });
          } else {
            res.status(500).json({ message: 'Failed to delete sound from database' });
          }
        } else {
          res.status(404).json({ message: 'Sound not found' });
        }
      } catch (error) {
        console.error("Error in DELETE method:", error);
        res.status(500).json({ message: 'Failed to delete sound', error: error.message });
      }
    }

        
}


