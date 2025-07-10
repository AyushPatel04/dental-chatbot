import { useState, useEffect } from 'react';
import './Dashboard.css';

export default function Dashboard() {
    const [appointments, setAppointments] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                // This correctly uses an environment variable for the API URL.
                // Ensure REACT_APP_API_URL is set in your Vercel deployment environment.
                const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5050';
                const response = await fetch(`${apiUrl}/get-appointments`);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch appointments');
                }
                const data = await response.json();
                
                // Sort appointments by date and time. This logic is robust and handles YYYY-MM-DD format.
                const sortedData = data.sort((a, b) => {
                    const dateA = new Date(`${a.bookingDay} ${a.timeSlot.replace(/(AM|PM)/, ' $1')}`);
                    const dateB = new Date(`${b.bookingDay} ${b.timeSlot.replace(/(AM|PM)/, ' $1')}`);
                    return dateA - dateB;
                });
                setAppointments(sortedData);
            } catch (err) {
                setError(err.message);
                console.error("Fetch error:", err);
            }
        };

        fetchAppointments();
    }, []);

    return (
        <div className="dashboard-page">
            <header className="dashboard-header">
                <h1>🗓️ Appointments Dashboard</h1>
                <p>Live view of appointments booked via the Kaysee chatbot.</p>
            </header>
            <main className="dashboard-content">
                {error && <p className="error-message">Error: {error}</p>}
                <div className="table-container">
                    {appointments.length > 0 ? (
                        <table className="appointments-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Time</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Visit Type</th>
                                    <th>Reason</th>
                                    <th>Insurance</th>
                                    <th>Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appointments.map((app, index) => (
                                    <tr key={index}>
                                        <td>{app.bookingDay}</td>
                                        <td>{app.timeSlot}</td>
                                        <td>{app.fullName}</td>
                                        <td>{app.email}</td>
                                        <td>
                                            <span className={`visit-type ${app.reasonCategory?.toLowerCase()}`}>
                                                {app.reasonCategory}
                                            </span>
                                        </td>
                                        <td>{app.reason}</td>
                                        <td>{app.hasInsurance ? app.insuranceProvider : 'N/A'}</td>
                                        <td>{app.notes}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>No appointments booked yet.</p>
                    )}
                </div>
            </main>
        </div>
    );
}