fetch("https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyBQ9GS4gTZrBC1eQoQ8yzJNrZMyM0QVQMU")
.then(res => res.json())
.then(data => console.log(data.models.map(m => m.name).join("\n")))
.catch(err => console.error(err));
