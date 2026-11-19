fetch('https://image.pollinations.ai/prompt/cat')
  .then(async res => {
      console.log(res.status, res.headers.get('content-type'));
  })
  .catch(console.error);
