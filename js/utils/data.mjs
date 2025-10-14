
export const getData = () => {
    const hoje = new Date();

    const dia = hoje.getDate();
    const mes = hoje.getMonth() + 1; // Os meses são indexados de 0 a 11, então adicionamos 1
    const ano = hoje.getFullYear();

    return `${dia}/${mes}/${ano}`
}