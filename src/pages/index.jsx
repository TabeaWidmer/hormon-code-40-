import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Questionnaire from "./Questionnaire";

import Plans from "./Plans";

import Knowledge from "./Knowledge";

import Diary from "./Diary";

import Coach from "./Coach";

import Recipes from "./Recipes";

import AdminRecipes from "./AdminRecipes";

import recipes from "./recipes";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Questionnaire: Questionnaire,
    
    Plans: Plans,
    
    Knowledge: Knowledge,
    
    Diary: Diary,
    
    Coach: Coach,
    
    Recipes: Recipes,
    
    AdminRecipes: AdminRecipes,
    
    recipes: recipes,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Questionnaire" element={<Questionnaire />} />
                
                <Route path="/Plans" element={<Plans />} />
                
                <Route path="/Knowledge" element={<Knowledge />} />
                
                <Route path="/Diary" element={<Diary />} />
                
                <Route path="/Coach" element={<Coach />} />
                
                <Route path="/Recipes" element={<Recipes />} />
                
                <Route path="/AdminRecipes" element={<AdminRecipes />} />
                
                <Route path="/recipes" element={<recipes />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}