const formData = new URLSearchParams();
formData.append('text', 'A futuristic water invention');

fetch('https://api.deepai.org/api/text2img', {
    method: 'POST',
    headers: {
        'api-key': 'quickstart-QUdJIGlzIGNvbWluZy4uLiEA'
    },
    body: formData
})
.then(res => res.json())
.then(data => console.log(data))
.catch(console.error);
