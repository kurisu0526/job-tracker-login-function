import { login } from './login.mjs';

export const handler = async (event) => {
    try {
        const body = JSON.parse(event.body || '{}');

        const result = await login(
            body.email,
            body.password
        );

        return {
            statusCode: 200,
            body: JSON.stringify(result)
        };
    } catch (err) {
        let response = {
            statusCode: 500,
            body: JSON.stringify({
                message: 'There was a problem logging in. Please try again later.',
                details: err.message
            })
        };
        if(err.code === 'LOGIN_FAILED') {
            response.statusCode = 401;
            response.body = JSON.stringify({
                message: 'Invalid email or password',
                details: err.message
            });
        }
        return response;
    }
};