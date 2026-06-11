import Layout from '@/layout';

const Page = ({ children }: { children: React.ReactNode }) => {
    return (
        <main data-layer="Page" className="w-screen h-screen bg-bg-1 grid grid-cols-[auto_1fr]">
            <Layout.Sidebar />
            
            {children}
        </main>
    );
}

export default Page;