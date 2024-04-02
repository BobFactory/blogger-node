export default interface Blog {
    title: string;
    description: string;
    img: string;
    tags: string[];
    slug: string;
    content: string;
    createdAt?: Date;
}