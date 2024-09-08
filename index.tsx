import { useRef, ChangeEvent, useState } from "react";
import Head from "next/head";
import path from "path";
import axios from "axios";


export default function Home() {
  
  const [soundFileRef, setFile] = useState<File | null>(null);
  const [soundNameRef, setSoundName] = useState("");

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }

    console.log(soundFileRef);
  };

  function handleNameChange(event: ChangeEvent<HTMLTextAreaElement>) {
      setSoundName(event.target.value);
  };

  async function handleSubmit() {

    const soundFile = soundFileRef;
    if (!soundFile) return;
    
    let soundName = soundNameRef;     // Default soundName is file name
    if (!soundName) { soundName = soundFile.name.replace(/\.mp3$/, ''); }

    const filePath = path.join(__dirname, 'uploads', soundFile.name);

    const fd = new FormData()
    fd.append("method", "POST")
    fd.append("soundFile", soundFile)
    fd.append("soundName", soundName)
    fd.append("filePath", filePath)


    try {
      const res = await fetch(        // sends post method with formData to api
        'http://localhost:3000/api/soundUpload', {
        method: "POST",
        body: fd, 
      });
      const response = await res.json();
    } catch (e) {return e;}

    // FIX WHEN YOU REFORMAT FILE STRUCTURE
    window.location.href = "/submitted"   // redirects to submitted page

  }

  return (
    <>
      <Head>
        <link rel="stylesheet"/>
        <title>Bitjockey Sound Request</title>
        <link rel="icon" href="Bitjockey-Logo.webp" />
      </Head>
      <div className="flex flex-col w-full h-[100svh]">
        <div className="flex w-full h-[10%]">
          <header className="flex h-full w-full items-center justify-between p-4 bg-black">
          </header>
        </div>
        <div className="flex flex-col w-full h-[90%] m-12">
          <div className="flex flex-col w-[70%] h-[90%]">
            <h1>Sound Request</h1>
            <p>Once submitted and approved, your sound will be added to your soundboard</p>
              <div className="flex flex-col">
                <input type="file" id="sound" name="sound" accept="audio/mp3, audio/wav" onChange={handleFileChange} />
                <textarea
                  className="m-50%"
                  rows={5}
                  name="soundText"
                  id="soundText"
                  placeholder="Type sound name here..."
                  onChange={handleNameChange}
                />
                <input className="button" type="submit" value="Submit" onClick={handleSubmit}/>
              </div>
          </div>
        </div>
      </div>
    </>
  );
}