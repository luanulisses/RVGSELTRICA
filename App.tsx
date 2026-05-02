import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './layouts/ProtectedRoute';

// Views - Public
import Landing from './views/Landing';
import FullGallery from './views/FullGallery';
import ServicePage from './views/ServicePage';

// Views - Admin
import AdminDashboard from './views/admin/Dashboard';
import AdminLeads from './views/admin/Leads';
import AdminAgenda from './views/admin/Agenda';
import AdminLogin from './views/admin/Login';
import AdminPlaceholder from './views/admin/Placeholder';
import AdminSiteContent from './views/admin/SiteContent';
import AdminGallery from './views/admin/GalleryManager';
import AdminTestimonials from './views/admin/TestimonialsManager';
import AdminFeatures from './views/admin/FeaturesManager';
import AdminFinanceiro from './views/admin/Financeiro';
import AdminClients from './views/admin/Clients';
import AdminSuppliers from './views/admin/Suppliers';
import AdminPackages from './views/admin/Packages';
import AdminReports from './views/admin/Reports';
import AdminContractGenerator from './views/admin/ContractGenerator';
import AdminContracts from './views/admin/Contracts';
import AdminNotaFiscal from './views/admin/NotaFiscal';
import AdminBilling from './views/admin/Billing';

// Guards
import SubscriptionGuard from './components/admin/SubscriptionGuard';

const App: React.FC = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/galeria" element={<FullGallery />} />
                <Route path="/servicos/:slug" element={<ServicePage />} />
                <Route path="/admin/login" element={<AdminLogin />} />

                {/* Admin Routes (Protected) */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/admin" element={<AdminLayout />}>
                        {/* Guarded Routes */}
                        <Route element={<SubscriptionGuard />}>
                            <Route index element={<AdminDashboard />} />
                            <Route path="orcamentos" element={<AdminLeads />} />
                            <Route path="agenda" element={<AdminAgenda />} />
                            <Route path="clientes" element={<AdminClients />} />
                            <Route path="fornecedores" element={<AdminSuppliers />} />
                            <Route path="financeiro" element={<AdminFinanceiro />} />
                            <Route path="relatorios" element={<AdminReports />} />
                            <Route path="conteudo" element={<AdminSiteContent />} />
                            <Route path="galeria" element={<AdminGallery />} />
                            <Route path="depoimentos" element={<AdminTestimonials />} />
                            <Route path="pacotes" element={<AdminPackages />} />
                            <Route path="contratos" element={<AdminContracts />} />
                            <Route path="nota-fiscal" element={<AdminNotaFiscal />} />
                            <Route path="contratos/novo" element={<AdminContractGenerator />} />
                            <Route path="contratos/:id" element={<AdminContractGenerator />} />
                            <Route path="config" element={<AdminPlaceholder title="Configurações" />} />
                        </Route>

                        {/* Unguarded Admin Routes */}
                        <Route path="billing" element={<AdminBilling />} />
                    </Route>
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;