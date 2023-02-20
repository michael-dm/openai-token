# OpenAIAuth for Node.js
OpenAI Authentication Library for ChatGPT.

### Usage
```js
import Authenticator from 'openai-token'

const auth = new Authenticator('my@email.com', 'myPassword')
await auth.begin()
const token = await auth.getAccessToken()
```

### Exemple
```js
//Part of auth

import Authenticator from 'openai-token'

const auth = new Authenticator('my@email.com', 'myPassword')
await auth.begin()
const token = await auth.getAccessToken()

//Part of request

const axios = require('axios');

const API_URL = 'https://api.openai.com/v1/engines/davinci-codex/completions';

async function generateText(prompt) {
  try {
    const response = await axios.post(API_URL, {
      prompt: prompt,
      max_tokens: 1024,
      temperature: 0.7,
      n: 1,
      stop: '\n',
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const { choices } = response.data?.choices?.[0] ?? { choices: [] };
    return choices.map(choice => choice.text).join('').trim();
  } catch (error) {
    console.error(error);
    return '';
  }
}

generateText("Qui est Micode?").then(response => console.log(response));

```

### Credits
Thank you to:

- https://github.com/michael-dm Owner of the repo
- https://github.com/acheong08/OpenAIAuth original python implementation
- [rawandahmad698] for the reverse engineering of the protocol
