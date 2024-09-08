import axios from 'axios'
import React, { useEffect, useState } from 'react'

interface Sound {
    id: number;
    name: string;
    path: string;
    approved: boolean;
}

export default function Table() {
    const [data, setData] = useState<Sound[]>([])

    useEffect(() => {       // gets data from database and saves it to a Sound variable
        axios.get('http://localhost:3000/api/soundUpload')
            .then(res => {
                console.log('API Response:', res.data);

                if (res.data && Array.isArray(res.data.sounds)) {
                    console.log('Sounds Array:', res.data.sounds);
                    if (res.data.sounds.length > 0) {
                        const unapprovedSounds = res.data.sounds.filter((sound: Sound) => !sound.approved);
                        setData(unapprovedSounds);
                    } else {
                        console.warn('The sounds array is empty.');
                    }
                } else {
                    console.error("Expected an array in res.data.sounds but got:", res.data.sounds);
                }
            })
            .catch(er => console.log(er));
    }, []);

    async function handleApprove(id: number) {  // when approve button is clicked, send a put request to change the approved variable of the sound to true
        try {
            const res = await fetch(
                `http://localhost:3000/api/soundUpload`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ id })
                });
            if (res.status === 200) {
                setData(data.filter(item => item.id !== id));
            } else {
                console.error('Error approving sound:', res);
            }
        } catch (err) {
            console.error('Error approving sound:', err);
        }
    };

    async function handleDeny(id: number) {     // when deny button is clicked, delete sound from database
        try {
            await fetch(`http://localhost:3000/api/soundUpload`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id }),
            });
            setData(data.filter(item => item.id !== id));
        } catch (err) {
            console.error('Error deleting sound:', err);
        }
    };

    async function handleRename(id: number, newName: string) {  // when rename button is clicked, set the current sound's name to whatever has been typed in the textbox
        try {
            await fetch(`http://localhost:3000/api/soundUpload`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id, newName })
            });
            setData(data.map(item => item.id === id ? { ...item, name: newName } : item));
        } catch (err) {
            console.error('Error renaming sound:', err);
        }
    };

    const handleNameChange = (id: number, newName: string) => { // updates the name textbox whenever it is altered
        setData(data.map(item => item.id === id ? { ...item, name: newName } : item));
    }

    return (
        <div>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Sound Name</th>
                        <th>Sound</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        data.map((sound) => (       // maps data from sql into Table
                            <tr key={sound.id}>
                                <td>{sound.id}</td>
                                <td>
                                    <input
                                        type="text"
                                        value={sound.name}
                                        onChange={(e) => handleNameChange(sound.id, e.target.value)}
                                    />
                                </td>
                                <td>
                                    <audio controls>
                                        <source src={sound.path} />
                                        Your browser does not support the audio element.
                                    </audio>
                                </td>
                                <td>
                                    <button onClick={() => handleApprove(sound.id)}>Approve</button>
                                    <button onClick={() => handleDeny(sound.id)}>Deny</button>
                                    <button onClick={() => handleRename(sound.id, sound.name)}>Rename</button>
                                </td>
                            </tr>
                        ))
                    }
                </tbody>
            </table>
        </div>
    )
}
