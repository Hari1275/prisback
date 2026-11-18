// Copyright IBM Corp. and LoopBack contributors 2019. All Rights Reserved.
// Node module: @prisback/boot
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {Provider} from '@prisback/core';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface GeocoderService {
  geocode(address: string): Promise<GeoPoint>;
}

// A dummy service instance to make unit testing easier
const GeocoderSingleton: GeocoderService = {
  geocode(address: string) {
    return Promise.resolve({lat: 0, lng: 0});
  },
};

export class GeocoderServiceProvider implements Provider<GeocoderService> {
  value(): Promise<GeocoderService> {
    return Promise.resolve(GeocoderSingleton);
  }
}
