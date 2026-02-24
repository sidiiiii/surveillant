async function registerTestSchool() {
    try {
        const res = await fetch('http://localhost:3000/api/auth/register-school', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                schoolName: 'Test School 123',
                schoolAddress: 'Test Address',
                schoolEmail: 'test@school.com',
                schoolPhone: '12345678',
                adminName: 'Test Admin',
                adminEmail: 'testadmin@gmail.com',
                password: 'password123'
            })
        });
        const data = await res.json();
        console.log('Registration Success:', data);
    } catch (e) {
        console.error('Registration failed:', e.message);
    }
}

registerTestSchool();
