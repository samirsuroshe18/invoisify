import React from 'react';
import { Typography, Avatar, Container, Grid, Paper, LinearProgress, Box, Card, CardContent, CardHeader } from '@mui/material';
import { FaFileInvoice, FaMoneyBillAlt, FaClipboardList, FaStar } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import Navbar from '../components/Navbar';

const Dashboard = () => {
    const user = useSelector(state => state.auth?.userData);
    console.log('userData dashboard', user);

    // Dummy data (Replace with backend data)
    const freeInvoicesSent = 6; 
    const totalInvoices = 120; 
    const totalMoneyEarned = 2500; 
    const maxFreeInvoices = 10; 
    const maxTotalInvoices = 500; 
    const maxEarnings = 5000; 

    
    const progressFreeInvoices = (freeInvoicesSent / maxFreeInvoices) * 100;
    const progressInvoices = (totalInvoices / maxTotalInvoices) * 100;
    const progressEarnings = (totalMoneyEarned / maxEarnings) * 100;

    return (
        <div style={{ backgroundColor: '#f4f6f9', minHeight: '100vh' }}>
            <Navbar activePage="Dashboard" />
            <Container style={{ marginTop: '30px' }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <Paper style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '10px' }}>
                            <Avatar src={user?.profilePic} style={{ width: '100px', height: '100px', margin: '0 auto', border: '4px solid #3f51b5' }} />
                            <Typography variant="h6" align="center" style={{ marginTop: '10px', fontWeight: 'bold' }}>
                                {user?.name}
                            </Typography>
                            <Typography variant="body1" align="center" style={{ color: '#666' }}>
                                {user?.email}
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={8}>
                        <Paper style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '10px' }}>
                            <Typography variant="h5" style={{ fontWeight: 'bold' }}>Welcome back, {user?.name}!</Typography>
                            <Typography variant="body1" style={{ marginTop: '10px', color: '#444' }}>
                                Here's an overview of your performance. Keep up the great work!
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>

               
                <Grid container spacing={3} style={{ marginTop: '30px' }}>
                    <Grid item xs={12} md={4}>
                        <Card style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '10px' }}>
                            <CardHeader
                                title="Free Invoices Sent"
                                subheader={`Sent ${freeInvoicesSent} of ${maxFreeInvoices}`}
                                avatar={<FaFileInvoice size={40} color="#3f51b5" />}
                            />
                            <LinearProgress variant="determinate" value={progressFreeInvoices} style={{ marginTop: '20px' }} />
                            <Typography variant="body1" align="center" style={{ marginTop: '10px' }}>
                                Progress: {Math.round(progressFreeInvoices)}%
                            </Typography>
                        </Card>
                        
                        <Card style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '10px', marginTop: '30px' }}>
                            <CardHeader
                                title="Recent Activities"
                                subheader="Here's what has been happening recently"
                                avatar={<FaStar size={40} color="#3f51b5" />}
                            />
                            <CardContent>
                                <Typography variant="body1">
                                    <strong>Invoice #12345</strong> was successfully sent on 15th December, 2024.
                                </Typography>
                                <Typography variant="body1" style={{ marginTop: '10px' }}>
                                    <strong>Invoice #12346</strong> is pending review.
                                </Typography>
                               
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Card style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '10px' }}>
                            <CardHeader
                                title="Total Invoices Done"
                                subheader={`${totalInvoices} invoices completed`}
                                avatar={<FaClipboardList size={40} color="#3f51b5" />}
                            />
                            <Box display="flex" justifyContent="center" alignItems="center" style={{ marginTop: '20px' }}>
                                <CircularProgressbar
                                    value={progressInvoices}
                                    maxValue={100}
                                    text={`${Math.round(progressInvoices)}%`}
                                    styles={buildStyles({
                                        pathColor: '#FF5F00',
                                        textColor: '#3f51b5',
                                        trailColor: '#f3f4f6',
                                        strokeLinecap: 'round',
                                        pathTransitionDuration: 0.5,
                                    })}
                                />
                            </Box>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Card style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '10px' }}>
                            <CardHeader
                                title="Total Money Earned"
                                subheader={`Earned $${totalMoneyEarned}`}
                                avatar={<FaMoneyBillAlt size={40} color="#3f51b5" />}
                            />
                            <Box display="flex" justifyContent="center" alignItems="center" style={{ marginTop: '20px' }}>
                                <CircularProgressbar
                                    value={progressEarnings}
                                    maxValue={100}
                                    text={`${Math.round(progressEarnings)}%`}
                                    styles={buildStyles({
                                        pathColor: '#FFD700',
                                        textColor: '#3f51b5',
                                        trailColor: '#f3f4f6',
                                        strokeLinecap: 'round',
                                        pathTransitionDuration: 0.5,
                                    })}
                                />
                            </Box>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </div>
    );
};

export default Dashboard;
