import type IRespositorio from "../interfaces/IRespositorio";
import type IUsuario from "../interfaces/IUsuario";

export default function montaUsuario(dadosUsuario: any, dadosRepositorios: any): IUsuario {
    
    const repositorios_recentes = dadosRepositorios.map((repositorio) => {
        return {
            nome: repositorio.name,
            url: repositorio.url
        } as IRespositorio;
    });
    
    return {
        avatar_url: dadosUsuario.avatar_url,
        login: dadosUsuario.login,
        name: dadosUsuario.name,
        perfil_url: dadosUsuario.html_url,
        repositorios_publicos: dadosUsuario.public_repos,
        seguidores: dadosUsuario.followers,
        repositorios_recentes
    };
}