import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Map of relative paths to alias paths
const aliasMap = {
  '../components/': '@components/',
  '../../components/': '@components/',
  '../../../components/': '@components/',
  '../../../../components/': '@components/',
  '../../../../../components/': '@components/',
  '../../../../../../components/': '@components/',
  '../lib/': '@lib/',
  '../../lib/': '@lib/',
  '../../../lib/': '@lib/',
  '../../../../lib/': '@lib/',
  '../../../../../lib/': '@lib/',
  '../../../../../../lib/': '@lib/',
  '../layouts/': '@layouts/',
  '../../layouts/': '@layouts/',
  '../../../layouts/': '@layouts/',
  '../../../../layouts/': '@layouts/',
  '../../../../../layouts/': '@layouts/',
  '../../../../../../layouts/': '@layouts/',
  '../config/': '@config/',
  '../../config/': '@config/',
  '../../../config/': '@config/',
  '../../../../config/': '@config/',
  '../../../../../config/': '@config/',
  '../../../../../../config/': '@config/',
  '../utils/': '@utils/',
  '../../utils/': '@utils/',
  '../../../utils/': '@utils/',
  '../../../../utils/': '@utils/',
  '../../../../../utils/': '@utils/',
  '../../../../../../utils/': '@utils/',
  '../types/': '@types/',
  '../../types/': '@types/',
  '../../../types/': '@types/',
  '../../../../types/': '@types/',
  '../../../../../types/': '@types/',
  '../../../../../../types/': '@types/',
  '../styles/': '@styles/',
  '../../styles/': '@styles/',
  '../../../styles/': '@styles/',
  '../../../../styles/': '@styles/',
  '../../../../../styles/': '@styles/',
  '../../../../../../styles/': '@styles/',
  '../assets/': '@assets/',
  '../../assets/': '@assets/',
  '../../../assets/': '@assets/',
  '../../../../assets/': '@assets/',
  '../../../../../assets/': '@assets/',
  '../../../../../../assets/': '@assets/',
  '../constants/': '@constants/',
  '../../constants/': '@constants/',
  '../../../constants/': '@constants/',
  '../../../../constants/': '@constants/',
  '../../../../../constants/': '@constants/',
  '../../../../../../constants/': '@constants/',
  '../hooks/': '@hooks/',
  '../../hooks/': '@hooks/',
  '../../../hooks/': '@hooks/',
  '../../../../hooks/': '@hooks/',
  '../../../../../hooks/': '@hooks/',
  '../../../../../../hooks/': '@hooks/',
  '../context/': '@context/',
  '../../context/': '@context/',
  '../../../context/': '@context/',
  '../../../../context/': '@context/',
  '../../../../../context/': '@context/',
  '../../../../../../context/': '@context/',
  '../services/': '@services/',
  '../../services/': '@services/',
  '../../../services/': '@services/',
  '../../../../services/': '@services/',
  '../../../../../services/': '@services/',
  '../../../../../../services/': '@services/',
  '../api/': '@api/',
  '../../api/': '@api/',
  '../../../api/': '@api/',
  '../../../../api/': '@api/',
  '../../../../../api/': '@api/',
  '../../../../../../api/': '@api/',
  '../db/': '@db/',
  '../../db/': '@db/',
  '../../../db/': '@db/',
  '../../../../db/': '@db/',
  '../../../../../db/': '@db/',
  '../../../../../../db/': '@db/',
  '../middleware/': '@middleware/',
  '../../middleware/': '@middleware/',
  '../../../middleware/': '@middleware/',
  '../../../../middleware/': '@middleware/',
  '../../../../../middleware/': '@middleware/',
  '../../../../../../middleware/': '@middleware/',
};

function fixImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;

  // Replace relative imports with aliases (catch any number of ../)
  Object.entries(aliasMap).forEach(([relative, alias]) => {
    const regex = new RegExp(`from ['"]${relative.replace(/\./g, '\\.')}([^'\"]+)['"]`, 'g');
    newContent = newContent.replace(regex, `from '${alias}$1'`);
  });

  // Generic catch-all for any deep relative import that matches a known alias
  newContent = newContent.replace(/from ['"]((\.\.\/)+)([a-zA-Z0-9_-]+)\/(.+?)['"]/g, (match, up, _, folder, rest) => {
    const alias = {
      components: '@components/',
      lib: '@lib/',
      layouts: '@layouts/',
      config: '@config/',
      utils: '@utils/',
      types: '@types/',
      styles: '@styles/',
      assets: '@assets/',
      constants: '@constants/',
      hooks: '@hooks/',
      context: '@context/',
      services: '@services/',
      api: '@api/',
      db: '@db/',
      middleware: '@middleware/',
    }[folder];
    if (alias) {
      return `from '${alias}${rest}'`;
    }
    return match;
  });

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent);
    console.log(`Fixed imports in ${filePath}`);
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.astro')) {
      fixImports(filePath);
    }
  });
}

// Start processing from src directory
processDirectory('src'); 