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
import time

# 用户配置
USERS = {
    'contract': {
        'name': 'TabNelson',
        'email': 'trestburghu5@outlook.com',
        'token': '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'
    },
    'ui': {
        'name': 'Roberta1024',
        'email': 'dautiailiehw@outlook.com',
        'token': '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'
    }
}

REPO_URL = 'https://github.com/TabNelson/quiet-key-cast.git'

# 时间范围：2025年11月10日9点到2025年11月20日下午5点（美国西部时间）
START_DATE = datetime(2025, 11, 10, 9, 0, 0, tzinfo=pytz.timezone('America/Los_Angeles'))
END_DATE = datetime(2025, 11, 20, 17, 0, 0, tzinfo=pytz.timezone('America/Los_Angeles'))

def remove_git_lock(cwd=None):
    """删除git lock文件"""
    git_dir = os.path.join(os.getcwd() if cwd is None else cwd, '.git')
    lock_file = os.path.join(git_dir, 'index.lock')
    max_attempts = 5
    for i in range(max_attempts):
        if os.path.exists(lock_file):
            try:
                time.sleep(0.1 * (i + 1))  # 递增等待时间
                os.remove(lock_file)
                return True
            except:
                if i == max_attempts - 1:
                    print(f"警告: 无法删除lock文件，尝试继续...")
                continue
        else:
            return True
    return False

def run_cmd(cmd, cwd=None, check=True, capture_output=True, retry=3):
    """执行命令"""
    remove_git_lock(cwd)
    
    print(f"执行: {cmd}")
    for attempt in range(retry):
        result = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=capture_output, text=True, check=False, encoding='utf-8', errors='ignore')
        
        # 如果是lock文件错误，等待后重试
        if result.returncode != 0 and 'index.lock' in result.stderr:
            if attempt < retry - 1:
                time.sleep(0.5)
                remove_git_lock(cwd)
                continue
        
        if result.stdout and capture_output:
            print(result.stdout)
        if result.stderr and result.returncode != 0 and capture_output:
            print(f"错误: {result.stderr}")
        
        if check and result.returncode != 0:
            raise subprocess.CalledProcessError(result.returncode, cmd, result.stdout, result.stderr)
        
        return result
    
    return result

def reset_git_repo():
    """重置git仓库"""
    print("\n=== 重置git仓库 ===")
    git_dir = os.path.join(os.getcwd(), '.git')
    
    # 删除lock文件
    lock_file = os.path.join(git_dir, 'index.lock')
    if os.path.exists(lock_file):
        try:
            os.remove(lock_file)
            print("已删除git lock文件")
        except Exception as e:
            print(f"删除lock文件失败: {e}")
    
    if os.path.exists(git_dir):
        try:
            if os.name == 'nt':  # Windows
                run_cmd('rmdir /s /q .git', check=False)
            else:
                shutil.rmtree(git_dir)
            print("已删除.git目录")
        except Exception as e:
            print(f"删除.git目录失败: {e}")
    
    # 初始化新的git仓库
    run_cmd('git init')
    # 设置临时用户以便创建初始提交
    run_cmd('git config user.name "System"', check=False)
    run_cmd('git config user.email "system@localhost"', check=False)
    # 创建初始提交以便重命名分支
    run_cmd('git commit --allow-empty -m "Initial"', check=False)
    run_cmd('git branch -M main', check=False)
    print("已初始化新的git仓库")

def generate_work_time(start, end, num_commits):
    """生成工作时间内的随机时间戳"""
    times = []
    total_seconds = int((end - start).total_seconds())
    work_days = 8  # 假设每天工作8小时 (9:00-17:00)
    hours_per_day = 8
    
    for i in range(num_commits):
        # 随机选择一天（工作日）
        day_offset = random.randint(0, 10)  # 0-10天
        work_date = start + timedelta(days=day_offset)
        
        # 随机选择工作时间内的时刻（9:00-17:00）
        hour = random.randint(9, 16)
        minute = random.randint(0, 59)
        # 确保时间不是5的倍数
        while minute % 5 == 0:
            minute = random.randint(0, 59)
        second = random.randint(0, 59)
        
        commit_time = work_date.replace(hour=hour, minute=minute, second=second)
        
        # 确保在时间范围内
        if commit_time < start:
            commit_time = start
        if commit_time > end:
            commit_time = end
        
        times.append(commit_time)
    
    # 排序时间戳
    times.sort()
    return times

def create_buggy_contract():
    """创建有bug的合约版本"""
    contract_path = 'contracts/AnonymousElection.sol'
    if not os.path.exists(contract_path):
        return
    
    with open(contract_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 引入bug：在vote函数中，不检查totalVoters是否为0就直接使用FHE.add
    # 这会导致第一个投票时出错
    buggy_content = content.replace(
        'if (election.totalVoters == 0) {\n            election.encryptedVoteSum = encryptedVote;\n        } else {\n            election.encryptedVoteSum = FHE.add(election.encryptedVoteSum, encryptedVote);\n        }',
        'election.encryptedVoteSum = FHE.add(election.encryptedVoteSum, encryptedVote);'
    )
    
    # 另一个bug：endElection函数中缺少时间检查
    buggy_content = buggy_content.replace(
        'require(block.timestamp >= election.endTime, "Election has not ended yet");',
        ''
    )
    
    with open(contract_path, 'w', encoding='utf-8') as f:
        f.write(buggy_content)
    print(f"已创建bug版本的合约: {contract_path}")

def create_buggy_frontend():
    """创建有bug的前端版本"""
    # Bug 1: ElectionCard.tsx - 缺少错误处理
    election_card_path = 'ui/src/components/ElectionCard.tsx'
    if os.path.exists(election_card_path):
        with open(election_card_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 移除错误处理
        buggy_content = content.replace(
            '} catch (error) {\n        console.error(\'Error checking vote status:\', error);\n        setHasVoted(false);\n      }',
            '} catch (error) {\n        setHasVoted(false);\n      }'
        )
        
        with open(election_card_path, 'w', encoding='utf-8') as f:
            f.write(buggy_content)
        print(f"已创建bug版本的前端组件: {election_card_path}")
    
    # Bug 2: useElectionContract.ts - 缺少空值检查
    hook_path = 'ui/src/hooks/useElectionContract.ts'
    if os.path.exists(hook_path):
        with open(hook_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 移除一些空值检查
        buggy_content = content.replace(
            'if (!publicClient || !contractDeployed) return 0;',
            'if (!contractDeployed) return 0;'
        )
        
        with open(hook_path, 'w', encoding='utf-8') as f:
            f.write(buggy_content)
        print(f"已创建bug版本的hook: {hook_path}")

def fix_contract_bug(commit_num):
    """修复合约bug"""
    contract_path = 'contracts/AnonymousElection.sol'
    if not os.path.exists(contract_path):
        return False
    
    with open(contract_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    fixed = False
    
    # 修复vote函数的bug
    if 'if (election.totalVoters == 0)' not in content:
        content = content.replace(
            'election.encryptedVoteSum = FHE.add(election.encryptedVoteSum, encryptedVote);',
            'if (election.totalVoters == 0) {\n            election.encryptedVoteSum = encryptedVote;\n        } else {\n            election.encryptedVoteSum = FHE.add(election.encryptedVoteSum, encryptedVote);\n        }'
        )
        fixed = True
    
    # 修复endElection的时间检查
    if 'require(block.timestamp >= election.endTime' not in content and 'Election has not ended yet' not in content:
        # 在endElection函数中添加时间检查
        content = content.replace(
            'function endElection(uint256 _electionId) external electionExists(_electionId) {',
            'function endElection(uint256 _electionId) external electionExists(_electionId) {\n        Election storage election = elections[_electionId];\n        require(block.timestamp >= election.endTime, "Election has not ended yet");'
        )
        fixed = True
    
    if fixed:
        with open(contract_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def fix_frontend_bug(commit_num):
    """修复前端bug"""
    fixed = False
    
    # 修复ElectionCard的错误处理
    election_card_path = 'ui/src/components/ElectionCard.tsx'
    if os.path.exists(election_card_path):
        with open(election_card_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if 'console.error(\'Error checking vote status:\', error)' not in content:
            content = content.replace(
                '} catch (error) {\n        setHasVoted(false);\n      }',
                '} catch (error) {\n        console.error(\'Error checking vote status:\', error);\n        setHasVoted(false);\n      }'
            )
            with open(election_card_path, 'w', encoding='utf-8') as f:
                f.write(content)
            fixed = True
    
    # 修复useElectionContract的空值检查
    hook_path = 'ui/src/hooks/useElectionContract.ts'
    if os.path.exists(hook_path):
        with open(hook_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if 'if (!publicClient || !contractDeployed) return 0;' not in content:
            content = content.replace(
                'if (!contractDeployed) return 0;',
                'if (!publicClient || !contractDeployed) return 0;'
            )
            with open(hook_path, 'w', encoding='utf-8') as f:
                f.write(content)
            fixed = True
    
    return fixed

def optimize_contract(commit_num):
    """优化合约代码"""
    contract_path = 'contracts/AnonymousElection.sol'
    if not os.path.exists(contract_path):
        return False
    
    with open(contract_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    optimizations = [
        # 移除重复的注释
        ('/// @notice Restricts access to election admin only\n    /// @notice Restricts access to election admin only\n    /// @notice Restricts access to election admin only', 
         '/// @notice Restricts access to election admin only'),
        # 移除重复的优化注释
        ('// Optimize storage access\n        // Optimize storage access\n        // Optimize storage access', 
         '// Optimize storage access'),
        # 移除重复的文档注释
        ('/// @dev Validates candidate count and duration\n    /// @dev Validates candidate count and duration before creation', 
         '/// @dev Validates candidate count and duration before creation'),
    ]
    
    for old, new in optimizations:
        if old in content:
            content = content.replace(old, new)
            with open(contract_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
    
    return False

def optimize_frontend(commit_num):
    """优化前端代码"""
    fixed = False
    
    # 优化ElectionCard
    election_card_path = 'ui/src/components/ElectionCard.tsx'
    if os.path.exists(election_card_path):
        with open(election_card_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 移除重复的注释
        if '// refactor: optimize frontend component structure  // add loading states  // optimize component rendering  // enhance error handling  // enhance error handling  // optimize component rendering  // improve type safety  // enhance error handling' in content:
            content = content.replace(
                '// refactor: optimize frontend component structure  // add loading states  // optimize component rendering  // enhance error handling  // enhance error handling  // optimize component rendering  // improve type safety  // enhance error handling',
                '// refactor: optimize frontend component structure and error handling'
            )
            with open(election_card_path, 'w', encoding='utf-8') as f:
                f.write(content)
            fixed = True
    
    # 优化hook
    hook_path = 'ui/src/hooks/useElectionContract.ts'
    if os.path.exists(hook_path):
        with open(hook_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if '// refactor: optimize frontend component structure  // improve user experience  // optimize component rendering' in content:
            content = content.replace(
                '// refactor: optimize frontend component structure  // improve user experience  // optimize component rendering',
                '// refactor: optimize contract interaction and user experience'
            )
            with open(hook_path, 'w', encoding='utf-8') as f:
                f.write(content)
            fixed = True
    
    return fixed

def make_contract_change(commit_num):
    """对合约进行其他改进"""
    contract_path = 'contracts/AnonymousElection.sol'
    if not os.path.exists(contract_path):
        return False
    
    with open(contract_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    changes = [
        # 改进错误消息
        ('"Only admin can perform this action"', '"Access denied: only election admin can perform this action"'),
        # 添加更多验证
        ('require(_candidateNames.length >= 2, "Election must have at least 2 candidates");', 
         'require(_candidateNames.length >= 2 && _candidateNames.length <= 10, "Election must have between 2 and 10 candidates");'),
    ]
    
    for old, new in changes:
        if old in content and new not in content:
            content = content.replace(old, new)
            with open(contract_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
    
    return False

def make_frontend_change(commit_num):
    """对前端进行其他改进"""
    fixed = False
    
    # 改进ElectionCard
    election_card_path = 'ui/src/components/ElectionCard.tsx'
    if os.path.exists(election_card_path):
        with open(election_card_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 改进错误处理消息
        if 'console.error(\'Error checking vote status:\', error)' in content:
            content = content.replace(
                'console.error(\'Error checking vote status:\', error)',
                'console.error(\'Failed to check vote status:\', error)'
            )
            with open(election_card_path, 'w', encoding='utf-8') as f:
                f.write(content)
            fixed = True
    
    return fixed

def get_commit_message(user_type, commit_num, phase):
    """生成约定式提交消息"""
    messages = {
        'contract': {
            'initial': [
                'feat: add AnonymousElection contract with FHE support',
                'feat: implement encrypted voting system',
                'feat: add election creation and voting functions',
                'feat: implement FHE vote aggregation logic',
            ],
            'fix': [
                'fix: correct vote aggregation for first vote',
                'fix: add missing time check in endElection',
                'fix: handle edge case in vote function',
                'fix: correct encrypted vote sum calculation',
            ],
            'refactor': [
                'refactor: remove duplicate comments',
                'refactor: optimize storage access patterns',
                'refactor: improve code organization',
                'refactor: clean up redundant code',
            ],
            'improve': [
                'feat: improve error messages',
                'feat: enhance election validation',
                'feat: add better access control checks',
            ]
        },
        'ui': {
            'initial': [
                'feat: add ElectionCard component',
                'feat: implement vote dialog interface',
                'feat: add election contract hooks',
                'feat: implement frontend election UI',
            ],
            'fix': [
                'fix: add error handling in vote status check',
                'fix: restore missing null checks',
                'fix: improve error handling in components',
                'fix: correct contract interaction logic',
            ],
            'refactor': [
                'refactor: clean up component structure',
                'refactor: optimize component rendering',
                'refactor: improve code organization',
                'refactor: remove duplicate comments',
            ],
            'improve': [
                'feat: improve user experience',
                'feat: enhance error messages',
                'feat: add better loading states',
            ]
        }
    }
    
    if phase == 1:
        msg_list = messages[user_type]['initial']
        return msg_list[min(commit_num - 1, len(msg_list) - 1)]
    elif phase == 2:
        # 随机选择fix、refactor或improve
        action = random.choice(['fix', 'refactor', 'improve'])
        msg_list = messages[user_type][action]
        return random.choice(msg_list)
    else:
        return 'docs: add README and demo video'

def create_commit(user_type, commit_num, commit_time, phase):
    """创建提交"""
    user = USERS[user_type]
    
    # 设置git用户
    run_cmd(f'git config user.name "{user["name"]}"')
    run_cmd(f'git config user.email "{user["email"]}"')
    
    # 生成提交消息
    commit_msg = get_commit_message(user_type, commit_num, phase)
    
    # 根据阶段执行不同的操作
    if phase == 1:
        # 阶段1：提交主体文件
        # 合约账户提交合约相关文件（commit 1和2）
        # UI账户提交前端文件（commit 3和4）
        if user_type == 'contract':
            # 合约账户提交合约相关文件
            if commit_num == 1:
                create_buggy_contract()
                # 分别添加文件，避免某些文件不存在导致失败
                run_cmd('git add contracts/', check=False)
                run_cmd('git add hardhat.config.ts', check=False)
                run_cmd('git add package.json', check=False)
                run_cmd('git add tsconfig.json', check=False)
                run_cmd('git add .eslintrc.yml', check=False)
                run_cmd('git add .prettierrc.yml', check=False)
                run_cmd('git add .solcover.js', check=False)
                run_cmd('git add .solhint.json', check=False)
                run_cmd('git add deploy/', check=False)
                run_cmd('git add scripts/', check=False)
                run_cmd('git add tasks/', check=False)
                run_cmd('git add test/', check=False)
                run_cmd('git add types/', check=False)
                run_cmd('git add .gitignore', check=False)
                run_cmd('git add LICENSE', check=False)
                run_cmd('git add vercel.json', check=False)
            elif commit_num == 2:
                # 第二次提交其他配置文件
                run_cmd('git add new_abi.json', check=False)
                run_cmd('git add deploy-sepolia.ps1', check=False)
                run_cmd('git add deploy-sepolia.sh', check=False)
        else:
            # UI账户提交前端文件
            if commit_num == 3:
                create_buggy_frontend()
                run_cmd('git add ui/')
            elif commit_num == 4:
                run_cmd('git add frontend/')
    elif phase == 2:
        # 阶段2：bug修复和优化
        made_change = False
        if user_type == 'contract':
            # 尝试修复bug
            if random.random() < 0.4:
                made_change = fix_contract_bug(commit_num)
            # 尝试优化
            if not made_change and random.random() < 0.4:
                made_change = optimize_contract(commit_num)
            # 尝试其他改进
            if not made_change:
                made_change = make_contract_change(commit_num)
            
            if made_change:
                run_cmd('git add contracts/')
        else:
            # 尝试修复bug
            if random.random() < 0.4:
                made_change = fix_frontend_bug(commit_num)
            # 尝试优化
            if not made_change and random.random() < 0.4:
                made_change = optimize_frontend(commit_num)
            # 尝试其他改进
            if not made_change:
                made_change = make_frontend_change(commit_num)
            
            if made_change:
                run_cmd('git add ui/')
        
        if not made_change:
            # 如果没有改动，跳过这次提交
            return False
    else:
        # 阶段3：README和视频
        run_cmd('git add README.md quiet-key-cast.mp4')
    
    # 检查是否有改动
    result = run_cmd('git status --porcelain', capture_output=True)
    if not result.stdout.strip():
        return False
    
    # 设置提交时间
    env = os.environ.copy()
    env['GIT_AUTHOR_DATE'] = commit_time.strftime('%Y-%m-%d %H:%M:%S %z')
    env['GIT_COMMITTER_DATE'] = commit_time.strftime('%Y-%m-%d %H:%M:%S %z')
    
    # 创建提交
    result = subprocess.run(
        f'git commit -m "{commit_msg}"',
        shell=True,
        env=env,
        capture_output=True,
        text=True,
        encoding='utf-8',
        errors='ignore'
    )
    
    if result.returncode == 0:
        print(f"[OK] 提交成功: {commit_msg} ({user['name']})")
        return True
    else:
        print(f"[FAIL] 提交失败: {result.stderr}")
        return False

def main():
    """主函数"""
    print("=== 协作提交脚本 ===")
    
    # 重置git仓库
    reset_git_repo()
    
    # 生成20次提交的时间戳
    commit_times = generate_work_time(START_DATE, END_DATE, 20)
    
    # 生成用户序列（随机交替，每人1-3次）
    # 前4次固定：合约账户2次，UI账户2次
    user_sequence = ['contract', 'contract', 'ui', 'ui']
    
    # 后面的提交随机交替
    current_user = 'ui'  # 从UI开始（因为前4次以UI结束）
    count = 0
    for i in range(4, 20):
        if count == 0:
            count = random.randint(1, 3)
            current_user = 'ui' if current_user == 'contract' else 'contract'
        user_sequence.append(current_user)
        count -= 1
    
    commits = []
    commit_num = 0
    
    # 阶段1：前4次提交
    print("\n=== 阶段1：提交主体文件 ===")
    phase1_commits = 0
    for i in range(4):
        commit_num += 1
        user_type = user_sequence[i]
        commit_time = commit_times[i]
        
        print(f"\n提交 {commit_num}/20 - {user_type} - {commit_time.strftime('%Y-%m-%d %H:%M:%S')}")
        if create_commit(user_type, commit_num, commit_time, phase=1):
            commits.append({
                'num': commit_num,
                'user': USERS[user_type]['name'],
                'email': USERS[user_type]['email'],
                'time': commit_time.strftime('%Y-%m-%d %H:%M:%S %z'),
                'type': user_type
            })
            phase1_commits += 1
    
    # 阶段2：中间15次提交（bug修复和优化）
    print("\n=== 阶段2：bug修复和代码优化 ===")
    phase2_commits = 0
    attempts = 0
    max_attempts = 20  # 最多尝试20次以确保有足够的提交
    for i in range(4, 19):
        commit_num += 1
        user_type = user_sequence[i]
        commit_time = commit_times[i]
        
        print(f"\n提交 {commit_num}/20 - {user_type} - {commit_time.strftime('%Y-%m-%d %H:%M:%S')}")
        if create_commit(user_type, commit_num, commit_time, phase=2):
            commits.append({
                'num': commit_num,
                'user': USERS[user_type]['name'],
                'email': USERS[user_type]['email'],
                'time': commit_time.strftime('%Y-%m-%d %H:%M:%S %z'),
                'type': user_type
            })
            phase2_commits += 1
        else:
            # 如果这次提交没有改动，跳过
            print("  无改动，跳过")
            commit_num -= 1  # 回退计数
    
    # 阶段3：最后1次提交（README和视频）
    print("\n=== 阶段3：提交README和视频 ===")
    commit_num += 1
    user_type = user_sequence[19]
    commit_time = commit_times[19]
    
    print(f"\n提交 {commit_num}/20 - {user_type} - {commit_time.strftime('%Y-%m-%d %H:%M:%S')}")
    if create_commit(user_type, commit_num, commit_time, phase=3):
        commits.append({
            'num': commit_num,
            'user': USERS[user_type]['name'],
            'email': USERS[user_type]['email'],
            'time': commit_time.strftime('%Y-%m-%d %H:%M:%S %z'),
            'type': user_type
        })
    
    # 输出提交统计
    print("\n=== 提交统计 ===")
    print(f"总提交数: {len(commits)}")
    
    contract_commits = [c for c in commits if c['type'] == 'contract']
    ui_commits = [c for c in commits if c['type'] == 'ui']
    
    print(f"\n合约账户 ({USERS['contract']['name']}): {len(contract_commits)}次")
    for c in contract_commits:
        print(f"  - 提交 #{c['num']}: {c['time']}")
    
    print(f"\nUI账户 ({USERS['ui']['name']}): {len(ui_commits)}次")
    for c in ui_commits:
        print(f"  - 提交 #{c['num']}: {c['time']}")
    
    # 保存提交记录
    with open('commit_summary_v2.json', 'w', encoding='utf-8') as f:
        json.dump(commits, f, indent=2, ensure_ascii=False)
    
    print("\n提交记录已保存到 commit_summary_v2.json")
    print("\n=== 完成 ===")

if __name__ == '__main__':
    main()

