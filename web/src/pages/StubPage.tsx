import React from 'react';
import { useParams } from 'react-router-dom';

const StubPage: React.FC = () => {
  const { slug } = useParams();
  return <div>这是{slug}页面</div>;
};

export default StubPage;