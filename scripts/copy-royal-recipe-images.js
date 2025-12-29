/**
 * 궁중 레시피 현대 이미지 파일 복사 스크립트
 * docs/royalrecipe에서 public/images/royalrecipe로 이미지 복사
 */

const fs = require('fs');
const path = require('path');

const sourceDirs = [
  'docs/royalrecipe/조선시대 레시피 현대 이미지',
  'docs/royalrecipe/고려시대 레시피 현대 이미지',
  'docs/royalrecipe/삼국시대 레시피 현대 이미지',
];

const targetBaseDir = 'public/images/royalrecipe';

sourceDirs.forEach((sourceDir) => {
  const dirName = path.basename(sourceDir);
  const targetDir = path.join(targetBaseDir, dirName);
  
  console.log(`\n📁 처리 중: ${dirName}`);
  
  // 소스 디렉토리 확인
  if (!fs.existsSync(sourceDir)) {
    console.warn(`⚠️  소스 디렉토리가 없습니다: ${sourceDir}`);
    return;
  }
  
  // 타겟 디렉토리 생성
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log(`✅ 디렉토리 생성: ${targetDir}`);
  }
  
  // 파일 복사
  try {
    const files = fs.readdirSync(sourceDir);
    const imageFiles = files.filter((file) => 
      /\.(png|jpg|jpeg)$/i.test(file)
    );
    
    let copiedCount = 0;
    imageFiles.forEach((file) => {
      const sourcePath = path.join(sourceDir, file);
      const targetPath = path.join(targetDir, file);
      
      try {
        fs.copyFileSync(sourcePath, targetPath);
        copiedCount++;
        console.log(`  ✅ 복사: ${file}`);
      } catch (error) {
        console.error(`  ❌ 복사 실패: ${file}`, error.message);
      }
    });
    
    console.log(`✅ 완료: ${copiedCount}/${imageFiles.length}개 파일 복사됨`);
  } catch (error) {
    console.error(`❌ 오류 발생:`, error.message);
  }
});

console.log('\n✨ 모든 이미지 복사 완료!');

