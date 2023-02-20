# OpenAIAuth for Node.js
OpenAI Authentication Library for ChatGPT.

### Usage
```js
import Authenticator from 'openai-token'

const auth = new Authenticator('my@email.com', 'myPassword')
await auth.begin()
const token = await auth.getAccessToken()
```

Credits
Thank you to:

- https://github.com/acheong08/OpenAIAuth original python implementation
- [rawandahmad698] for the reverse engineering of the protocol