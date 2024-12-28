import React from 'react';
import { AppBar, Toolbar, Typography, Button, Avatar, Container, Grid, Paper } from '@mui/material';
import Navbar from '../components/Navbar';
import { useSelector } from 'react-redux';

const Dashboard = () => {
    const user = useSelector(state => state.auth?.userData);
  console.log('userData dashboard', user);

    // const user = {
    //     name: 'John Doe',
    //     email: 'john.doe@example.com',
    //     avatarUrl: 'https://via.placeholder.com/150'
    // };

    return (
        <div>
            <Navbar activePage="Dashboard" />
            <Container style={{ marginTop: '20px' }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <Paper style={{ padding: '20px' }}>
                            <Avatar src={user?.profilePic} style={{ width: '100px', height: '100px', margin: '0 auto' }} />
                            <Typography variant="h6" align="center" style={{ marginTop: '10px' }}>
                                {user?.name}
                            </Typography>
                            <Typography variant="body1" align="center">
                                {user?.email}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={8}>
                        <Paper style={{ padding: '20px' }}>
                            <Typography variant="h5">Welcome to your dashboard, {user?.name}!</Typography>
                            <Typography variant="body1" style={{ marginTop: '10px' }}>
                                Here you can manage your profile, view your activities, and much more.
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </div>
    );
};

export default Dashboard;   