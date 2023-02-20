import axios, { AxiosInstance } from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

// create error class with location, statusCode and details
class HttpError extends Error {
  constructor(public location: string, public statusCode: number, public details: any) {
    super(details);
  }
}

// create Authenticator class
class Authenticator {
    private client: AxiosInstance
    private jar: CookieJar
    private userAgent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36"
    private accessToken: string | null = null;

    constructor(private email: string, private password: string) {
        this.jar = new CookieJar();
        this.client = wrapper(axios.create({ jar: this.jar }));
    }

    private static urlEncode(str: string) {
        return encodeURIComponent(str).replace(/%20/g, '+');
    }

    async begin(): Promise<void> {
        const url = "https://explorer.api.openai.com/api/auth/csrf"
        const headers = {
            "Host": "explorer.api.openai.com",
            "Accept": "*/*",
            "Connection": "keep-alive",
            "User-Agent": this.userAgent,
            "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
            "Referer": "https://explorer.api.openai.com/auth/login",
            "Accept-Encoding": "gzip, deflate, br",
        }
        const response = await this.client.get(url, { headers });
        if (response.status === 200 && response.data.csrfToken) {
            const csrfToken = response.data.csrfToken;
            await this.partOne(csrfToken);
        } else {
            throw new HttpError('begin', response.status, response.data);
        }
    }

    private async partOne(csrfToken: string): Promise<void> {
        const url = "https://explorer.api.openai.com/api/auth/signin/auth0?prompt=login"
        const payload = `callbackUrl=%2F&csrfToken=${csrfToken}&json=true`
        const headers = {
            "Host": "explorer.api.openai.com",
            "User-Agent": this.userAgent,
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "*/*",
            "Sec-Gpc": "1",
            "Accept-Language": "en-US,en;q=0.8",
            "Origin": "https://explorer.api.openai.com",
            "Sec-Fetch-Site": "same-origin",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Dest": "empty",
            "Referer": "https://explorer.api.openai.com/auth/login",
            "Accept-Encoding": "gzip, deflate",
        }
        const response = await this.client.post(url, payload, { headers });
        if (response.status === 200 && response.data.url) {
            const url2 = response.data.url;
            if (url2 === 'https://explorer.api.openai.com/api/auth/error?error=OAuthSignin' || url2.includes('error')) {
                throw new HttpError('partOne', response.status, 'You have been rate limited. Please try again later.');
            }
            await this.partTwo(url2);
        } else {
            throw new HttpError('partOne', response.status, response.data);
        }
    }

    private async partTwo(url: string): Promise<void> {
        const headers = {
            "Host": "auth0.openai.com",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Connection": "keep-alive",
            "User-Agent": this.userAgent,
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://explorer.api.openai.com/",
        }
        const response = await this.client.get(url, { headers });
        if (response.status === 302 || response.status === 200) {
            let state = response.data.match(/state=(.*)/)[1];
            state = state.split('"')[0];
            await this.partThree(state);
        } else {
            throw new HttpError('partTwo', response.status, response.data);
        }
    }

    private async partThree(state: string): Promise<void> {
        const url = `https://auth0.openai.com/u/login/identifier?state=${state}`
        const headers = {
            "Host": "auth0.openai.com",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Connection": "keep-alive",
            "User-Agent": this.userAgent,
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://explorer.api.openai.com/",
        }
        const response = await this.client.get(url, { headers });
        if (response.status === 200) {
            await this.partFour(state);
        } else {
            throw new HttpError('partThree', response.status, response.data);
        }
    }

    private async partFour(state: string): Promise<void> {
        const url = `https://auth0.openai.com/u/login/identifier?state=${state}`
        const emailEncoded = Authenticator.urlEncode(this.email);

        const payload = `state=${state}&username=${emailEncoded}&js-available=false&webauthn-available=true&is-brave=false&webauthn-platform-available=true&action=default `;
        const headers = {
            "Host": "auth0.openai.com",
            "Origin": "https://auth0.openai.com",
            "Connection": "keep-alive",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "User-Agent": this.userAgent,
            "Referer": `https://auth0.openai.com/u/login/identifier?state=${state}`,
            "Accept-Language": "en-US,en;q=0.9",
            "Content-Type": "application/x-www-form-urlencoded",
        }
        const response = await this.client.post(url, payload, { headers });
        if (response.status === 302 || response.status === 200) {
            await this.partFive(state);
        } else {
            throw new HttpError('partFour', response.status, "Your email address is invalid.");
        }
    }

    private async partFive(state: string): Promise<void> {
        const url = `https://auth0.openai.com/u/login/password?state=${state}`
        const emailEncoded = Authenticator.urlEncode(this.email);
        const passwordEncoded = Authenticator.urlEncode(this.password);
        const payload = `state=${state}&username=${emailEncoded}&password=${passwordEncoded}&action=default`;

        const headers = {
            "Host": "auth0.openai.com",
            "Origin": "https://auth0.openai.com",
            "Connection": "keep-alive",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "User-Agent": this.userAgent,
            "Referer": `https://auth0.openai.com/u/login/password?state=${state}`,
            "Accept-Language": "en-US,en;q=0.9",
            "Content-Type": "application/x-www-form-urlencoded",
        }
        const response = await this.client.post(url, payload, { headers, validateStatus: () => true });
    }

    async getAccessToken(): Promise<string> {
        const response = await this.client.get('https://explorer.api.openai.com/api/auth/session', { headers: { 'User-Agent': this.userAgent } });
        if (response.status === 200) {
            this.accessToken = response.data.accessToken;
            return this.accessToken!;
        } else {
            throw new HttpError('getAccessToken', response.status, response.data);
        }
    }

}

export default Authenticator;