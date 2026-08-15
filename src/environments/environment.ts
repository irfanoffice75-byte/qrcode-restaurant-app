// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  apiUrl: 'https://qrcode-restaurant-backend-production.up.railway.app/api',
  socketUrl: 'https://qrcode-restaurant-backend-production.up.railway.app',
  onesignalAppId: '47d79b69-8079-450e-b9bb-81d3840e6ef8',
  firebaseConfig: {
    apiKey: "AIzaSyCgLtdTFH65cbmjzt0W3vjQ5DeIfawyr5I",
    authDomain: "qr-code-restaurant-7ba27.firebaseapp.com",
    projectId: "qr-code-restaurant-7ba27",
    storageBucket: "qr-code-restaurant-7ba27.firebasestorage.app",
    messagingSenderId: "553674996905",
    appId: "1:553674996905:web:773c78dc7eec5100ef3db8"
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
