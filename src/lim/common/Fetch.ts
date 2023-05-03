export default class Fetch {
    public static getFetchToolkit(): any {
        let httpFetch: any;
        // @ts-ignore
        if (typeof global.fetch !== 'undefined' && typeof global.fetch === 'function') {
            // @ts-ignore
            httpFetch = global.fetch;
        } else if (typeof fetch === 'function') {
            httpFetch = fetch; // RN FETCH
        } else {
            /*WX_APP*/
            httpFetch = require("wxapp-fetch");
            /*WX_APP*/

            /*WEB_APP*/
            httpFetch = require("isomorphic-fetch")
            /*WEB_APP*/

            /*UNI_APP*/
            let uniFetch = require("../uniapp/http/uni-fetch")
            httpFetch = uniFetch.fetch
            /*UNI_APP*/
        }
        return httpFetch
    }
}