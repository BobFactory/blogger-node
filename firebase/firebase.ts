
import { initializeApp } from "firebase/app";
import type Blog from "../types/blog";
import { getFirestore, Firestore, collection, setDoc, getDocs, doc, Timestamp, getDoc, query, type DocumentData } from "firebase/firestore";

export async function initFireStore(): Promise<Firestore> {
    //Use thecommonwise firebase project setup config
    const firebaseConfig = {
        apiKey: "",
        authDomain: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: "",
        appId: ""
    };

    if (!firebaseConfig.apiKey) {
        throw new Error("Firebase config not set up");
    }

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    return db;
}


export async function uploadBlog(db: Firestore, blogData: Blog) {
    const newBlogRef = doc(db, "blogs", blogData.slug);
    await setDoc(newBlogRef, { ...blogData, createdAt: Timestamp.fromDate(new Date()) });
}

export async function getBlogBySlug(db: Firestore, slug: string): Promise<Blog> {
    const docRef = doc(db, "blogs", slug);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        return {
            title: data.title,
            description: data.description,
            img: data.img,
            tags: data.tags,
            slug: data.slug,
            content: data.content,
            createdAt: data.createdAt.toDate(),
        };
    } else {
        throw new Error("No such document!");
    }

}

export async function getAllBlogs(db: Firestore): Promise<Blog[]> {
    const q = query(collection(db, "blogs"));
    const querySnapshot = await getDocs(q);
    const results: Blog[] = [];

    let data: DocumentData
    querySnapshot.forEach((doc) => {
        data = doc.data();
        results.push({
            title: data.title, 
            description: data.description,
            img: data.img,
            tags: data.tags,
            slug: data.slug,
            content: data.content,
            createdAt: data.createdAt.toDate(),
        });

    });

    return results;
}

