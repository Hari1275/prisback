import {get, response, ResponseObject} from '@prisback/rest';

const PING_RESPONSE: ResponseObject = {
  description: 'Ping Response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        title: 'PingResponse',
        properties: {
          greeting: {type: 'string'},
          date: {type: 'string'},
          url: {type: 'string'},
        },
      },
    },
  },
};

/**
 * Health / smoke endpoint — shows up in /openapi.json
 */
export class PingController {
  @get('/ping')
  @response(200, PING_RESPONSE)
  ping(): object {
    return {
      greeting: 'Hello from PrisBack',
      date: new Date(),
      url: '/ping',
    };
  }
}
