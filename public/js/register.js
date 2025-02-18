document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const companyName = document.getElementById('companyName').value;

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password,
                companyName
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Registrering lyckades! Du kan nu logga in.');
            window.location.href = '/index.html';
        } else {
            alert('Registrering misslyckades: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Ett fel uppstod vid registrering');
    }
}); 