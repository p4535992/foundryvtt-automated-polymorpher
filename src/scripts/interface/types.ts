interface SystemApi {
    version: number;
    id: string;
    init?:()=>Promise<void>
}

interface System extends SystemApi {
    init?:()=>Promise<void>;
    checkValidity:()=>void;
    addModule:(name:string)=>void;
    register:(implementation:SystemApi)=>void;
    uuidToDocument: (string)=>Promise<foundry.abstract.Document<any, any>>
    objectAttributeGet:(obj:any, attribute:string)=>any,
    objectAttributeSet:(obj:any, attribute:string, value)=>void,
}
