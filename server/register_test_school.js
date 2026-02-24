const axios = require('axios');

async function registerTestSchool() {
    try {
        const res = await axios.post('http://localhost:3000/api/auth/register-school', {
            schoolName: 'Test School 123',
            schoolAddress: 'Test Address',
            schoolEmail: 'test@school.com',
            schoolPhone: '12345678',
            adminName: 'Test Admin',
            adminEmail: 'testadmin@gmail.com',
            password: 'password123'
        });
        console.log('Registration Success:', res.data);
    } catch (e) {
        console.error('Registration failed:', e.response?.data || e.message);
    }
}

registerTestSchool();
