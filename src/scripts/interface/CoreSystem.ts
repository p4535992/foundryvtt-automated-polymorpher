import CONSTANTS from "../constants.js";
import { error, i18n } from "../lib/lib.js";
// import {NAMESPACE} from "./main.js";

export class CoreSystem implements System {
    _implementation: SystemApi;
    _modules: string[] = [];

    checkValidity() {
        if (this._modules.length > 0 && this._implementation === undefined) {
            // @ts-ignore
            error(`System Interface | missing module ${CONSTANTS.MODULE_NAME} - ${game.system.id} <a href=''>module links</a>`,true);
            error("The following modules will not work" + this._modules);
            throw error(i18n(`${CONSTANTS.MODULE_NAME}.SystemNotFound`));
        }
    }

    addModule(name: string) {
        this._modules.push(name)
    }

    register(implementation) {
        if (implementation.id === game["system"].id) {
            this._implementation = implementation;
        }
    }

    async init(){
        if (this._implementation?.init !== undefined) {
            await this._implementation.init();
        }
    }

    get id(): string {
        return this._implementation.id;
    }

    get version(): number {
        return this._implementation.version;
    }

    async uuidToDocument(uuid: string): Promise<foundry.abstract.Document<any, any>> {
        const parts = uuid.split(".");
        let result: foundry.abstract.Document<any, any> | null = null;
        if (parts[0] === "Compendium") {
            const pack = game["packs"].get(parts[1] + "." + parts[2]);
            if (pack !== undefined) {
                result = <any>await pack.getDocument(<string>parts[3]);
            }
        } else {
            result = await fromUuid(uuid);
        }
        if (result === null) {
            throw new Error("System Interface | "+i18n(`${CONSTANTS.MODULE_NAME}.DocumentNotFound`)+ uuid);
        }
        return result;
    }

    objectAttributeGet(obj:any, attribute:string):any {
        const arr:string[] = attribute.split(".");
        while(arr.length){
            const prop = arr.shift();
            if(prop != undefined && prop != ""){
                obj = obj[prop]
            }
            if(obj === undefined){
                return undefined;
            }
        };
        return obj;
    }

    objectAttributeSet(obj:any, attribute:string, value):void {
        const arr:string[] = attribute.split(".");
        while(arr.length){
            const prop = arr.shift();
            if(prop != undefined && prop != ""){
                if(obj[prop] == undefined){
                    obj[prop]={}
                }
                if(arr.length === 0){
                    obj[prop]=value;
                }
                obj = obj[prop];
            }
        }
    }

}