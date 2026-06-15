document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('redirectButton');
    
    button.addEventListener('click', () => {
        const parameter = 'meuParametro';
        const value = '12345';
        window.location.href = `destination.html?${parameter}=${value}`;
    });
});
