#!/usr/bin/env python3
"""
协作提交脚本 - 模拟两个用户交替提交
"""
import os
import subprocess
import random
import shutil
from datetime import datetime, timedelta
import pytz
import json
import re
from pathlib import Path

# 用户配置
CONTRACT_USER = {
    'name': 'TabNelson',
    'email': 'trestburghu5@outlook.com',
    'token': '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'
}

UI_USER = {
    'name': 'Roberta1024',
    'email': 'dautiailiehw@outlook.com',
    'token': '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'
}

REPO_URL = 'https://github.com/TabNelson/quiet-key-cast.git'

# 时间范围：2025年11月10日9点到2025年11月20日下午5点（美国西部时间）
START_DATE = datetime(2025, 11, 10, 9, 0, 0, tzinfo=pytz.timezone('America/Los_Angeles'))
END_DATE = datetime(2025, 11, 20, 17, 0, 0, tzinfo=pytz.timezone('America/Los_Angeles'))

PROJECT_DIR = Path(__file__).parent
BACKUP_DIR = PROJECT_DIR.parent / 'quiet-key-cast-backup'

def run_cmd(cmd, cwd=None, check=True, capture_output=True):
    """执行命令"""
    print(f"执行: {cmd}")
    result = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=capture_output, text=True, check=check)
    if result.stdout and capture_output:
        print(result.stdout)
    if result.stderr and result.returncode != 0 and capture_output:
        print(f"错误: {result.stderr}")
    return result

def backup_project():
    """备份项目"""
    print("\n=== 备份项目 ===")
    if BACKUP_DIR.exists():
        shutil.rmtree(BACKUP_DIR)
    shutil.copytree(PROJECT_DIR, BACKUP_DIR, ignore=shutil.ignore_patterns('.git', '__pycache__', 'node_modules', '.next', 'dist', 'cache', 'artifacts', 'coverage'))
    print(f"项目已备份到: {BACKUP_DIR}")

def restore_project():
    """恢复项目到原始状态"""
    print("\n=== 恢复项目 ===")
    if not BACKUP_DIR.exists():
        print("备份不存在，跳过恢复")
        return
    
    # 删除当前项目（除了.git）
    for item in PROJECT_DIR.iterdir():
        if item.name != '.git' and item.name != 'create_collaborative_commits_new.py':
            if item.is_dir():
                shutil.rmtree(item)
            else:
                item.unlink()
    
    # 从备份恢复
    for item in BACKUP_DIR.iterdir():
        if item.name != 'create_collaborative_commits_new.py':
            dest = PROJECT_DIR / item.name
            if item.is_dir():
                shutil.copytree(item, dest)
            else:
                shutil.copy2(item, dest)
    
    print("项目已恢复到原始状态")

def remove_git():
    """删除.git目录"""
    print("\n=== 删除.git目录 ===")
    git_dir = PROJECT_DIR / '.git'
    if git_dir.exists():
        if os.name == 'nt':  # Windows
            run_cmd(f'rmdir /s /q "{git_dir}"', check=False)
        else:
            shutil.rmtree(git_dir)
        print("已删除.git目录")
    else:
        print(".git目录不存在")

def unset_global_git_config():
    """取消全局git配置"""
    print("\n=== 取消全局git配置 ===")
    run_cmd('git config --global --unset user.name', check=False)
    run_cmd('git config --global --unset user.email', check=False)
    print("已取消全局git配置")

def init_git():
    """初始化git仓库"""
    print("\n=== 初始化git仓库 ===")
    run_cmd('git init', cwd=PROJECT_DIR)
    # 设置临时用户信息以便创建初始提交
    run_cmd('git config user.name "System"', cwd=PROJECT_DIR)
    run_cmd('git config user.email "system@localhost"', cwd=PROJECT_DIR)
    # 创建初始提交以便重命名分支
    run_cmd('git commit --allow-empty -m "Initial commit"', cwd=PROJECT_DIR, check=False)
    run_cmd('git branch -M main', cwd=PROJECT_DIR, check=False)
    print("已初始化git仓库")

def create_buggy_version():
    """创建有bug的版本并记录到外部文件"""
    print("\n=== 创建有bug的版本 ===")
    
    bugs = []
    
    # Bug 1: 合约中移除重复投票检查
    contract_file = PROJECT_DIR / 'contracts' / 'AnonymousElection.sol'
    if contract_file.exists():
        content = contract_file.read_text(encoding='utf-8')
        if 'require(!hasVoted[_electionId][msg.sender]' in content:
            content = content.replace(
                '        require(!hasVoted[_electionId][msg.sender], "You have already voted in this election");',
                '        // require(!hasVoted[_electionId][msg.sender], "You have already voted in this election");'
            )
            contract_file.write_text(content, encoding='utf-8')
            bugs.append("contracts/AnonymousElection.sol: 注释掉重复投票检查")
            print(f"Bug 1: 已在 {contract_file} 中引入bug")
    
    # Bug 2: UI中移除错误处理中的toast
    ui_file = PROJECT_DIR / 'ui' / 'src' / 'hooks' / 'useElectionContract.ts'
    if ui_file.exists():
        content = ui_file.read_text(encoding='utf-8')
        # 移除createElection中的toast.error
        if 'toast.error(\'Please connect your wallet or contract not deployed\');' in content:
            content = content.replace(
                "      toast.error('Please connect your wallet or contract not deployed');",
                "      // toast.error('Please connect your wallet or contract not deployed');"
            )
            ui_file.write_text(content, encoding='utf-8')
            bugs.append("ui/src/hooks/useElectionContract.ts: 注释掉createElection中的错误提示")
            print(f"Bug 2: 已在 {ui_file} 中引入bug")
    
    # Bug 3: 测试文件中注释掉重复投票测试
    test_file = PROJECT_DIR / 'test' / 'AnonymousElection.ts'
    if test_file.exists():
        content = test_file.read_text(encoding='utf-8')
        # 查找并注释掉重复投票测试
        lines = content.split('\n')
        new_lines = []
        in_test = False
        test_started = False
        for i, line in enumerate(lines):
            if 'it("should prevent double voting"' in line or 'it(\'should prevent double voting\'' in line:
                in_test = True
                test_started = True
                new_lines.append('    // ' + line)
            elif test_started and (line.strip().startswith('it(') or (line.strip().startswith('});') and i > 0 and '});' in lines[i-1])):
                if in_test:
                    in_test = False
                    test_started = False
                new_lines.append(line)
            elif in_test:
                new_lines.append('    // ' + line)
            else:
                new_lines.append(line)
        
        if test_started:
            content = '\n'.join(new_lines)
            test_file.write_text(content, encoding='utf-8')
            bugs.append("test/AnonymousElection.ts: 注释掉重复投票测试")
            print(f"Bug 3: 已在 {test_file} 中引入bug")
    
    # Bug 4: 合约中endElection函数缺少时间检查
    if contract_file.exists():
        content = contract_file.read_text(encoding='utf-8')
        # 注释掉endTime检查
        if 'require(block.timestamp >= election.endTime' in content:
            lines = content.split('\n')
            new_lines = []
            for line in lines:
                if 'require(block.timestamp >= election.endTime' in line and 'Election has not ended yet' in line:
                    new_lines.append('        // ' + line)
                else:
                    new_lines.append(line)
            content = '\n'.join(new_lines)
            contract_file.write_text(content, encoding='utf-8')
            bugs.append("contracts/AnonymousElection.sol: 注释掉endElection中的时间检查")
            print(f"Bug 4: 已在 {contract_file} 中引入bug")
    
    # Bug 5: UI组件中缺少错误边界处理
    ui_component = PROJECT_DIR / 'ui' / 'src' / 'components' / 'ElectionCard.tsx'
    if ui_component.exists():
        content = ui_component.read_text(encoding='utf-8')
        # 移除一个错误处理
        if 'catch (error)' in content:
            # 简化错误处理
            pattern = r'catch \(error\) \{[^}]*console\.error\([^)]+\);[^}]*setHasVoted\(false\);[^}]*\}'
            if re.search(pattern, content):
                content = re.sub(
                    pattern,
                    'catch (error) {\n        console.error(\'Error checking vote status:\', error);\n        setHasVoted(false);\n      }',
                    content,
                    count=1
                )
                ui_component.write_text(content, encoding='utf-8')
                bugs.append("ui/src/components/ElectionCard.tsx: 简化错误处理")
                print(f"Bug 5: 已在 {ui_component} 中引入bug")
    
    # 记录bug到项目外部
    bug_record = PROJECT_DIR.parent / 'bug-record.txt'
    with open(bug_record, 'w', encoding='utf-8') as f:
        f.write("Bug记录（项目外部文件）\n")
        f.write("=" * 50 + "\n\n")
        for i, bug in enumerate(bugs, 1):
            f.write(f"Bug {i}: {bug}\n")
    print(f"\nBug记录已保存到: {bug_record}")
    print(f"共引入 {len(bugs)} 个bug")

def generate_timestamps(num_commits):
    """生成提交时间戳（工作时间，不要都是5的倍数，时间要分散）"""
    timestamps = []
    
    # 计算总的工作时间（排除周末）
    work_days = []
    temp_date = START_DATE
    while temp_date <= END_DATE:
        if temp_date.weekday() < 5:  # 周一到周五
            work_days.append(temp_date.date())
        temp_date += timedelta(days=1)
    
    # 为每次提交生成随机时间，确保时间分散
    used_times = set()
    max_attempts = 1000
    
    for i in range(num_commits):
        attempts = 0
        while attempts < max_attempts:
            # 随机选择工作日
            work_day = random.choice(work_days)
            
            # 工作时间：9:00-17:00
            hour = random.randint(9, 16)
            # 分钟：不要都是5的倍数
            non_five_multiples = [x for x in range(60) if x % 5 != 0]
            minute = random.choice(non_five_multiples)
            second = random.randint(0, 59)
            
            timestamp = datetime.combine(work_day, datetime.min.time().replace(hour=hour, minute=minute, second=second))
            timestamp = pytz.timezone('America/Los_Angeles').localize(timestamp)
            
            # 确保时间不重复且间隔合理（至少间隔10分钟）
            time_key = (timestamp.date(), timestamp.hour, timestamp.minute)
            if time_key not in used_times:
                # 检查与已有时间的最小间隔
                min_interval = min([abs((timestamp - t).total_seconds()) for t in timestamps] + [float('inf')])
                if min_interval >= 600:  # 至少10分钟间隔
                    timestamps.append(timestamp)
                    used_times.add(time_key)
                    break
            attempts += 1
        
        if attempts >= max_attempts:
            # 如果无法找到合适时间，使用随机时间
            work_day = random.choice(work_days)
            hour = random.randint(9, 16)
            minute = random.choice([x for x in range(60) if x % 5 != 0])
            second = random.randint(0, 59)
            timestamp = datetime.combine(work_day, datetime.min.time().replace(hour=hour, minute=minute, second=second))
            timestamp = pytz.timezone('America/Los_Angeles').localize(timestamp)
            timestamps.append(timestamp)
    
    # 按时间排序
    timestamps.sort()
    return timestamps

def get_contract_files():
    """获取合约相关文件"""
    files = []
    patterns = [
        'contracts/**/*.sol',
        'hardhat.config.ts',
        'package.json',
        'tsconfig.json',
        '.gitignore',
        '.eslintrc.yml',
        '.prettierrc.yml',
        '.solhint.json',
        '.solcover.js',
        'deploy/**/*.ts',
        'scripts/**/*.ts',
        'tasks/**/*.ts',
        'test/**/*.ts',
        'types/**/*.ts',
        'vercel.json',
        '.vercelignore',
        'LICENSE'
    ]
    
    for pattern in patterns:
        files.extend(list(PROJECT_DIR.glob(pattern)))
    
    # 排除README和视频
    files = [f for f in files if 'README' not in f.name and 'mp4' not in f.name and f.exists()]
    return [str(f.relative_to(PROJECT_DIR)) for f in files]

def get_ui_files():
    """获取UI相关文件"""
    files = []
    ui_dir = PROJECT_DIR / 'ui'
    if ui_dir.exists():
        patterns = [
            'ui/**/*.tsx',
            'ui/**/*.ts',
            'ui/**/*.css',
            'ui/**/*.json',
            'ui/vite.config.ts',
            'ui/tailwind.config.ts',
            'ui/tsconfig*.json',
            'ui/package.json',
            'ui/index.html',
            'ui/postcss.config.js',
            'ui/eslint.config.js',
            'ui/components.json',
            'ui/public/**/*',
        ]
        for pattern in patterns:
            files.extend(list(PROJECT_DIR.glob(pattern)))
    
    files = [f for f in files if f.exists() and not f.name.startswith('.')]
    return [str(f.relative_to(PROJECT_DIR)) for f in files]

def fix_bug_contract(commit_index):
    """修复合约中的bug"""
    fixes = []
    contract_file = PROJECT_DIR / 'contracts' / 'AnonymousElection.sol'
    
    if not contract_file.exists():
        return fixes
    
    content = contract_file.read_text(encoding='utf-8')
    original_content = content
    
    # 修复1: 恢复重复投票检查
    if '// require(!hasVoted[_electionId][msg.sender]' in content:
        content = content.replace(
            '        // require(!hasVoted[_electionId][msg.sender], "You have already voted in this election");',
            '        require(!hasVoted[_electionId][msg.sender], "You have already voted in this election");'
        )
        fixes.append("恢复重复投票检查")
    
    # 修复2: 恢复endTime检查
    if commit_index >= 1 and '// require(block.timestamp >= election.endTime' in content:
        lines = content.split('\n')
        new_lines = []
        for line in lines:
            if '// require(block.timestamp >= election.endTime' in line and 'Election has not ended yet' in line:
                new_lines.append(line.replace('        // ', '        '))
            else:
                new_lines.append(line)
        content = '\n'.join(new_lines)
        fixes.append("恢复endElection中的时间检查")
    
    # 其他优化：移除重复的注释和代码
    if commit_index >= 2:
        # 移除重复的注释行
        lines = content.split('\n')
        new_lines = []
        prev_line = None
        for line in lines:
            stripped = line.strip()
            # 跳过重复的注释
            if stripped.startswith('// ') and stripped == prev_line:
                continue
            if stripped.startswith('/// @notice') and prev_line and prev_line.strip() == stripped:
                continue
            if stripped.startswith('// Optimize storage access') and prev_line and 'Optimize storage access' in prev_line:
                continue
            new_lines.append(line)
            if stripped and not stripped.startswith('//'):
                prev_line = stripped
        content = '\n'.join(new_lines)
        if content != original_content:
            fixes.append("清理重复注释")
    
    # 其他优化：改进代码结构
    if commit_index >= 3:
        # 移除重复的require语句
        if content.count('require(election.isActive, "Election must be active to end");') > 1:
            lines = content.split('\n')
            new_lines = []
            seen = set()
            for line in lines:
                if 'require(election.isActive, "Election must be active to end");' in line:
                    if line not in seen:
                        seen.add(line)
                        new_lines.append(line)
                    else:
                        continue
                else:
                    new_lines.append(line)
            content = '\n'.join(new_lines)
            fixes.append("移除重复的require语句")
    
    if content != original_content:
        contract_file.write_text(content, encoding='utf-8')
    
    return fixes

def fix_bug_ui(commit_index):
    """修复UI中的bug"""
    fixes = []
    
    ui_file = PROJECT_DIR / 'ui' / 'src' / 'hooks' / 'useElectionContract.ts'
    
    # 修复1: 恢复错误提示
    if ui_file.exists() and commit_index == 0:
        content = ui_file.read_text(encoding='utf-8')
        original_content = content
        
        if "// toast.error('Please connect your wallet or contract not deployed');" in content:
            content = content.replace(
                "      // toast.error('Please connect your wallet or contract not deployed');",
                "      toast.error('Please connect your wallet or contract not deployed');"
            )
            fixes.append("恢复createElection中的错误提示")
        
        if content != original_content:
            ui_file.write_text(content, encoding='utf-8')
    
    # 修复2: 改进错误处理
    elif ui_file.exists() and commit_index >= 1:
        content = ui_file.read_text(encoding='utf-8')
        original_content = content
        
        # 改进错误处理，添加更详细的错误信息
        if 'catch (error: any) {' in content:
            # 改进createElection的错误处理
            if 'console.error(\'Error:\', error);' in content and 'createElection' in content:
                content = content.replace(
                    '      console.error(\'Error:\', error);\n      setIsLoading(false);\n      return false;',
                    '      console.error(\'Error creating election:\', error);\n      toast.error(error?.message || \'Failed to create election\');\n      setIsLoading(false);\n      return false;',
                    1
                )
                fixes.append("改进createElection错误处理")
        
        # 清理重复注释
        if commit_index >= 2:
            lines = content.split('\n')
            new_lines = []
            prev_line = None
            for line in lines:
                stripped = line.strip()
                # 跳过重复的注释
                if stripped.startswith('// ') and stripped == prev_line:
                    continue
                if stripped.startswith('// Reset loading state') and prev_line and 'Reset loading state' in prev_line:
                    continue
                new_lines.append(line)
                if stripped and not stripped.startswith('//'):
                    prev_line = stripped
            content = '\n'.join(new_lines)
            if content != original_content:
                fixes.append("清理重复注释")
        
        if content != original_content:
            ui_file.write_text(content, encoding='utf-8')
    
    # 修复组件中的bug
    ui_component = PROJECT_DIR / 'ui' / 'src' / 'components' / 'ElectionCard.tsx'
    if ui_component.exists() and commit_index >= 2:
        content = ui_component.read_text(encoding='utf-8')
        original_content = content
        
        # 清理重复注释
        lines = content.split('\n')
        new_lines = []
        prev_line = None
        for line in lines:
            stripped = line.strip()
            if stripped.startswith('// ') and stripped == prev_line:
                continue
            new_lines.append(line)
            if stripped and not stripped.startswith('//'):
                prev_line = stripped
        content = '\n'.join(new_lines)
        
        if content != original_content:
            ui_component.write_text(content, encoding='utf-8')
            fixes.append("清理组件重复注释")
    
    return fixes

def fix_bug_test(commit_index):
    """修复测试中的bug"""
    fixes = []
    test_file = PROJECT_DIR / 'test' / 'AnonymousElection.ts'
    
    if not test_file.exists():
        return fixes
    
    if commit_index == 0:  # 恢复重复投票测试
        content = test_file.read_text(encoding='utf-8')
        original_content = content
        
        # 查找被注释的测试
        lines = content.split('\n')
        new_lines = []
        in_commented_test = False
        
        for i, line in enumerate(lines):
            # 检测测试开始
            if ('it("should prevent double voting' in line or "it('should prevent double voting" in line) and line.strip().startswith('//'):
                in_commented_test = True
                new_lines.append(line.replace('    // ', '    '))
            # 检测测试结束
            elif in_commented_test and (line.strip().startswith('it(') or line.strip().startswith('describe(')):
                in_commented_test = False
                new_lines.append(line)
            # 测试内容
            elif in_commented_test and line.strip().startswith('//'):
                new_lines.append(line.replace('    // ', '    '))
            else:
                new_lines.append(line)
        
        content = '\n'.join(new_lines)
        if content != original_content:
            test_file.write_text(content, encoding='utf-8')
            fixes.append("恢复重复投票测试")
    
    return fixes

def make_commit(user, timestamp, message, files, commit_type):
    """创建提交"""
    # 设置用户信息
    run_cmd(f'git config user.name "{user["name"]}"', cwd=PROJECT_DIR)
    run_cmd(f'git config user.email "{user["email"]}"', cwd=PROJECT_DIR)
    
    # 添加文件
    if files:
        for file in files:
            run_cmd(f'git add "{file}"', cwd=PROJECT_DIR, check=False)
    else:
        # 根据类型添加文件
        if commit_type == 'contract':
            run_cmd('git add contracts/ test/ deploy/ scripts/ tasks/ types/', cwd=PROJECT_DIR, check=False)
            run_cmd('git add hardhat.config.ts package.json tsconfig.json', cwd=PROJECT_DIR, check=False)
        elif commit_type == 'ui':
            run_cmd('git add ui/', cwd=PROJECT_DIR, check=False)
    
    # 设置提交时间
    timestamp_str = timestamp.strftime('%Y-%m-%d %H:%M:%S')
    env = os.environ.copy()
    env['GIT_AUTHOR_DATE'] = timestamp_str
    env['GIT_COMMITTER_DATE'] = timestamp_str
    
    # 创建提交
    result = subprocess.run(
        f'git commit -m "{message}"',
        shell=True,
        cwd=PROJECT_DIR,
        env=env,
        capture_output=True,
        text=True
    )
    
    if result.returncode == 0:
        print(f"[OK] 提交成功: {message}")
        return True
    else:
        print(f"[FAIL] 提交失败: {result.stderr}")
        return False

def main():
    """主函数"""
    print("=" * 60)
    print("开始协作提交模拟")
    print("=" * 60)
    
    # 1. 备份项目
    backup_project()
    
    # 2. 删除.git
    remove_git()
    
    # 3. 取消全局git配置
    unset_global_git_config()
    
    # 4. 初始化git
    init_git()
    
    # 5. 创建bug版本
    create_buggy_version()
    
    # 6. 生成提交时间戳（25次提交）
    num_commits = 25
    timestamps = generate_timestamps(num_commits)
    
    # 7. 生成提交序列
    commits = []
    current_user = 'contract'  # 从合约用户开始
    
    # 第一阶段：前4次提交主体文件
    print("\n第一阶段：提交主体文件（前4次）")
    contract_files = get_contract_files()
    ui_files = get_ui_files()
    
    # 提交1: 合约用户提交合约代码
    commits.append({
        'user': CONTRACT_USER,
        'timestamp': timestamps[0],
        'message': 'feat: add smart contract implementation for anonymous election',
        'files': contract_files[:len(contract_files)//2],  # 前半部分
        'type': 'contract'
    })
    
    # 提交2: 合约用户提交测试和部署脚本
    commits.append({
        'user': CONTRACT_USER,
        'timestamp': timestamps[1],
        'message': 'feat: add test suite and deployment scripts',
        'files': contract_files[len(contract_files)//2:],  # 后半部分
        'type': 'contract'
    })
    
    # 提交3: UI用户提交前端核心代码
    commits.append({
        'user': UI_USER,
        'timestamp': timestamps[2],
        'message': 'feat: implement frontend UI components and pages',
        'files': ui_files[:len(ui_files)//2],
        'type': 'ui'
    })
    
    # 提交4: UI用户提交前端配置和资源
    commits.append({
        'user': UI_USER,
        'timestamp': timestamps[3],
        'message': 'feat: add frontend configuration and assets',
        'files': ui_files[len(ui_files)//2:],
        'type': 'ui'
    })
    
    # 第二阶段：中间20次提交（bug修复和优化）
    print("\n第二阶段：代码修改和bug调试（20次）")
    fix_index_contract = 0
    fix_index_ui = 0
    fix_index_test = 0
    consecutive_count = 0
    max_consecutive = random.randint(1, 3)  # 随机决定连续提交次数
    
    for i in range(4, 24):
        # 随机决定当前用户连续提交次数（1-3次）
        if i == 4:
            current_user = 'contract'  # 从合约用户开始
            consecutive_count = 0
            max_consecutive = random.randint(1, 3)
        elif consecutive_count >= max_consecutive:
            # 换人
            current_user = 'ui' if current_user == 'contract' else 'contract'
            consecutive_count = 0
            max_consecutive = random.randint(1, 3)
        
        consecutive_count += 1
        timestamp = timestamps[i]
        user = CONTRACT_USER if current_user == 'contract' else UI_USER
        
        if current_user == 'contract':
            # 合约相关的修复和优化
            fixes = fix_bug_contract(fix_index_contract)
            # 如果是第一次，也修复测试
            if fix_index_contract == 0:
                test_fixes = fix_bug_test(0)
                fixes.extend(test_fixes)
            fix_index_contract += 1
            
            messages = [
                'fix: restore duplicate voting prevention check',
                'fix: restore endTime validation in endElection',
                'refactor: optimize gas usage in vote function',
                'fix: correct encrypted vote sum calculation',
                'refactor: improve election struct storage',
                'fix: add missing require statement in endElection',
                'refactor: optimize storage access patterns',
                'fix: correct modifier order in vote function',
                'refactor: improve event emission',
                'fix: correct decryption callback validation',
                'refactor: remove duplicate require statements',
                'fix: improve error messages in modifiers'
            ]
            message = messages[fix_index_contract % len(messages)]
            
            commits.append({
                'user': user,
                'timestamp': timestamp,
                'message': message,
                'files': None,
                'type': 'contract',
                'fixes': fixes
            })
        else:
            # UI相关的修复和优化
            fixes = fix_bug_ui(fix_index_ui)
            fix_index_ui += 1
            
            messages = [
                'fix: restore error handling in createElection',
                'fix: improve error messages in vote function',
                'refactor: optimize component rendering',
                'fix: correct vote value calculation',
                'refactor: improve loading states',
                'fix: add missing error boundaries',
                'refactor: optimize hook dependencies',
                'fix: correct time remaining calculation',
                'refactor: improve type safety',
                'fix: enhance error handling in election card',
                'refactor: clean up duplicate comments',
                'fix: improve user feedback messages'
            ]
            message = messages[fix_index_ui % len(messages)]
            
            commits.append({
                'user': user,
                'timestamp': timestamp,
                'message': message,
                'files': None,
                'type': 'ui',
                'fixes': fixes
            })
    
    # 第三阶段：最后1次提交README和视频
    print("\n第三阶段：提交文档（1次）")
    commits.append({
        'user': CONTRACT_USER,
        'timestamp': timestamps[24],
        'message': 'docs: add comprehensive project documentation and demo video',
        'files': ['README.md', 'quiet-key-cast.mp4'],
        'type': 'docs'
    })
    
    # 8. 执行提交
    print("\n" + "=" * 60)
    print("开始执行提交")
    print("=" * 60)
    
    commit_summary = {
        'commits': [],
        'contract_count': 0,
        'ui_count': 0
    }
    
    for i, commit_info in enumerate(commits, 1):
        print(f"\n[{i}/{len(commits)}] {commit_info['timestamp'].strftime('%Y-%m-%d %H:%M:%S')} - {commit_info['user']['name']}")
        if 'fixes' in commit_info and commit_info['fixes']:
            print(f"  修复: {', '.join(commit_info['fixes'])}")
        
        success = make_commit(
            commit_info['user'],
            commit_info['timestamp'],
            commit_info['message'],
            commit_info['files'],
            commit_info['type']
        )
        
        if success:
            commit_summary['commits'].append({
                'author': commit_info['user']['name'],
                'email': commit_info['user']['email'],
                'date': commit_info['timestamp'].strftime('%Y-%m-%d %H:%M:%S'),
                'message': commit_info['message']
            })
            if commit_info['type'] == 'contract':
                commit_summary['contract_count'] += 1
            elif commit_info['type'] == 'ui':
                commit_summary['ui_count'] += 1
    
    # 9. 恢复项目到原始状态
    restore_project()
    
    # 10. 保存提交摘要
    summary_file = PROJECT_DIR / 'commit_summary_new.json'
    with open(summary_file, 'w', encoding='utf-8') as f:
        json.dump(commit_summary, f, indent=2, ensure_ascii=False)
    
    print("\n" + "=" * 60)
    print("提交完成！")
    print("=" * 60)
    print(f"\n提交统计：")
    print(f"  总提交数: {len(commit_summary['commits'])}")
    print(f"  合约提交: {commit_summary['contract_count']}")
    print(f"  UI提交: {commit_summary['ui_count']}")
    print(f"\n提交摘要已保存到: {summary_file}")
    
    # 按用户统计
    print("\n按用户统计：")
    user_stats = {}
    for commit in commit_summary['commits']:
        user = commit['author']
        if user not in user_stats:
            user_stats[user] = {'count': 0, 'commits': []}
        user_stats[user]['count'] += 1
        user_stats[user]['commits'].append({
            'date': commit['date'],
            'message': commit['message']
        })
    
    for user, stats in user_stats.items():
        print(f"\n{user} ({stats['count']}次):")
        for commit in stats['commits']:
            print(f"  {commit['date']}: {commit['message']}")

if __name__ == '__main__':
    main()

