import type IRespositorio from "./IRespositorio";

export default interface IUsuario {
    login: string;
    avatar_url:string;
    perfil_url:string;
    repositorios_publicos:number;
    seguidores:number;
    name: string;
    repositorios_recentes: IRespositorio[];
}