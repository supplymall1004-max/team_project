#!/usr/bin/env python3
"""
통합 마이그레이션 파일 생성 스크립트
중고거래 사이트 형식에 맞춰 현재 Supabase 테이블들을 통합하여 마이그레이션 파일 생성
"""

import json
from typing import Dict, List, Any

def map_postgres_type_to_mysql_format(data_type: str, format_type: str) -> str:
    """PostgreSQL 타입을 중고거래 사이트 형식(MySQL 스타일)으로 변환"""
    type_mapping = {
        'uuid': 'uuid',
        'text': 'text',
        'character varying': 'varchar',
        'varchar': 'varchar',
        'integer': 'int4',
        'int4': 'int4',
        'bigint': 'bigint',
        'boolean': 'bool',
        'bool': 'bool',
        'numeric': 'numeric',
        'timestamp with time zone': 'timestamp',
        'timestamptz': 'timestamp',
        'date': 'date',
        'time without time zone': 'time',
        'time': 'time',
        'jsonb': 'jsonb',
        'inet': 'inet',
        'ARRAY': 'array',
    }
    
    if format_type:
        if format_type.startswith('_'):
            base_type = format_type[1:]
            return f'{base_type}[]'
        return type_mapping.get(format_type, data_type.lower())
    
    return type_mapping.get(data_type.lower(), data_type.lower())

def format_default_value(default: str) -> str:
    """기본값 포맷팅"""
    if not default:
        return ''
    
    # PostgreSQL 함수를 그대로 유지
    if 'gen_random_uuid()' in default:
        return 'gen_random_uuid()'
    if 'now()' in default:
        return 'now()'
    if 'ARRAY[]' in default:
        return "ARRAY[]::text[]"
    if default.startswith("'") and default.endswith("'::"):
        return default
    if default.startswith("'") and default.endswith("'"):
        return default
    
    return default

def generate_table_ddl(table: Dict[str, Any]) -> str:
    """테이블 DDL 생성"""
    schema = table.get('schema', 'public')
    name = table.get('name')
    columns = table.get('columns', [])
    primary_keys = table.get('primary_keys', [])
    comment = table.get('comment', '')
    
    lines = []
    lines.append(f"DROP TABLE IF EXISTS `{name}`;")
    lines.append("")
    lines.append(f"CREATE TABLE `{name}` (")
    
    col_defs = []
    for col in columns:
        col_name = col.get('name')
        data_type = col.get('data_type', '')
        format_type = col.get('format', '')
        options = col.get('options', [])
        default_value = col.get('default_value')
        comment_col = col.get('comment', '')
        
        # 타입 결정
        pg_type = map_postgres_type_to_mysql_format(data_type, format_type)
        
        # NULL 허용 여부
        nullable = 'nullable' in options
        null_str = '' if nullable else '\tNOT NULL'
        
        # UNIQUE
        unique_str = ''
        if 'unique' in options:
            unique_str = '\tUNIQUE'
        
        # 기본값
        default_str = ''
        if default_value:
            formatted_default = format_default_value(default_value)
            default_str = f'\tDEFAULT {formatted_default}'
        
        # COMMENT
        comment_str = ''
        if comment_col:
            comment_str = f"\tCOMMENT '{comment_col}'"
        
        col_def = f"\t`{col_name}`\t{pg_type}{null_str}{unique_str}{default_str}{comment_str}"
        col_defs.append(col_def)
    
    lines.append(',\n'.join(col_defs))
    lines.append(");")
    lines.append("")
    
    return '\n'.join(lines)

def generate_primary_keys(table: Dict[str, Any]) -> str:
    """PRIMARY KEY 제약조건 생성"""
    name = table.get('name')
    primary_keys = table.get('primary_keys', [])
    
    if not primary_keys:
        return ''
    
    lines = []
    pk_cols = ', '.join([f"`{pk}`" for pk in primary_keys])
    constraint_name = f"PK_{name.upper()}"
    lines.append(f"ALTER TABLE `{name}` ADD CONSTRAINT `{constraint_name}` PRIMARY KEY (")
    lines.append(f"\t{pk_cols}")
    lines.append(");")
    lines.append("")
    
    return '\n'.join(lines)

def generate_foreign_keys(table: Dict[str, Any]) -> str:
    """FOREIGN KEY 제약조건 생성"""
    name = table.get('name')
    foreign_keys = table.get('foreign_key_constraints', [])
    
    if not foreign_keys:
        return ''
    
    lines = []
    for fk in foreign_keys:
        fk_name = fk.get('name', '')
        source = fk.get('source', '')
        target = fk.get('target', '')
        
        # source: public.table.column
        # target: public.table.column
        source_parts = source.split('.')
        target_parts = target.split('.')
        
        if len(source_parts) == 3 and len(target_parts) == 3:
            source_table = source_parts[1]
            source_col = source_parts[2]
            target_table = target_parts[1]
            target_col = target_parts[2]
            
            # FK 이름이 없으면 생성
            if not fk_name:
                fk_name = f"FK_{target_table}_TO_{source_table}_1"
            
            lines.append(f"ALTER TABLE `{source_table}` ADD CONSTRAINT `{fk_name}` FOREIGN KEY (")
            lines.append(f"\t`{source_col}`")
            lines.append(")")
            lines.append(f"REFERENCES `{target_table}` (")
            lines.append(f"\t`{target_col}`")
            lines.append(");")
            lines.append("")
    
    return '\n'.join(lines)

def consolidate_tables(tables: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """테이블 통합 로직"""
    # 통합 전략:
    # 1. user_subscriptions를 subscriptions에 통합 (기존 subscriptions에 필드 추가)
    # 2. 알림 관련 테이블은 이미 notifications로 통합됨
    # 3. 설정 테이블들은 기능이 다르므로 유지
    
    consolidated = []
    processed = set()
    
    for table in tables:
        name = table.get('name')
        
        # user_subscriptions는 subscriptions에 통합
        if name == 'user_subscriptions':
            # subscriptions 테이블에 필드 추가
            subscriptions_table = next((t for t in tables if t.get('name') == 'subscriptions'), None)
            if subscriptions_table:
                # subscription_plan 필드를 subscriptions에 추가
                user_sub_cols = table.get('columns', [])
                for col in user_sub_cols:
                    if col.get('name') == 'subscription_plan':
                        # subscriptions에 이미 있는지 확인
                        existing_cols = [c.get('name') for c in subscriptions_table.get('columns', [])]
                        if 'subscription_plan' not in existing_cols:
                            subscriptions_table['columns'].append(col)
                processed.add('subscriptions')
                processed.add('user_subscriptions')
                continue
        
        if name not in processed:
            consolidated.append(table)
            processed.add(name)
    
    return consolidated

def main():
    """메인 함수"""
    print("이 스크립트는 Supabase MCP 응답을 기반으로 통합 마이그레이션 파일을 생성합니다.")
    print("실제 사용 시에는 MCP 응답을 JSON 파일로 저장하여 사용하세요.")
    
    # 예시 출력
    print("\n생성될 파일 형식:")
    print("- DROP TABLE IF EXISTS")
    print("- CREATE TABLE (백틱 사용)")
    print("- ALTER TABLE PRIMARY KEY")
    print("- ALTER TABLE FOREIGN KEY")

if __name__ == '__main__':
    main()












