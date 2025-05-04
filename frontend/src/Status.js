import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Status = () => {
    const [status, setStatus] = useState(null);

    // Efecto para obtener el estado de la plataforma al cargar el componente
    useEffect(() => {
        axios.get('http://backend:5000/api/status')
            .then(response => {
                setStatus(response.data);
            })
            .catch(error => {
                console.error('There was an error fetching the status!', error);
            });
    }, []);

    if (!status) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1>Status of the Platform</h1>
            <p>{status.status}</p>
            <p>Containers Running: {status.containers}</p>
            <p>Users: {status.users}</p>
        </div>
    );
};

export default Status;
