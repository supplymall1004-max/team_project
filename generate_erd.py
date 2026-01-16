#!/usr/bin/env python3
"""
ERDCloud용 데이터베이스 스키마 DDL 생성 스크립트
Supabase MCP에서 받은 테이블 정보를 기반으로 ERDCloud 형식의 SQL DDL을 생성합니다.
"""

import json
import sys

# 테이블 정보는 Supabase MCP에서 받은 데이터를 기반으로 합니다
# 실제 사용 시에는 MCP 응답을 파싱하여 사용합니다

def generate_ddl_from_tables(tables_data):
    """테이블 데이터로부터 DDL 생성"""
    
    ddl_parts = []
    ddl_parts.append("-- ERDCloud용 데이터베이스 스키마 DDL")
    ddl_parts.append("-- Supabase 프로젝트: xlbhrgvnfioxtvocwban")
    ddl_parts.append("-- 생성일: 2025-01-27")
    ddl_parts.append("")
    ddl_parts.append("-- ============================================")
    ddl_parts.append("-- 테이블 생성")
    ddl_parts.append("-- ============================================")
    ddl_parts.append("")
    
    # 테이블 생성
    for table in tables_data:
        schema = table.get('schema', 'public')
        name = table.get('name')
        columns = table.get('columns', [])
        primary_keys = table.get('primary_keys', [])
        comment = table.get('comment', '')
        
        ddl_parts.append(f"-- {name} 테이블")
        ddl_parts.append(f"CREATE TABLE {schema}.{name} (")
        
        column_defs = []
        for col in columns:
            col_name = col.get('name')
            data_type = col.get('data_type', '')
            format_type = col.get('format', '')
            options = col.get('options', [])
            default_value = col.get('default_value')
            comment_col = col.get('comment', '')
            
            # 데이터 타입 결정
            if format_type == 'uuid':
                type_str = 'UUID'
            elif format_type == 'text':
                type_str = 'TEXT'
            elif format_type == 'varchar':
                type_str = 'VARCHAR'
            elif format_type == 'int4':
                type_str = 'INTEGER'
            elif format_type == 'bool':
                type_str = 'BOOLEAN'
            elif format_type == 'numeric':
                type_str = 'NUMERIC'
            elif format_type == 'timestamptz':
                type_str = 'TIMESTAMPTZ'
            elif format_type == 'date':
                type_str = 'DATE'
            elif format_type == 'time':
                type_str = 'TIME'
            elif format_type == 'jsonb':
                type_str = 'JSONB'
            elif format_type.startswith('_'):
                # 배열 타입
                base_type = format_type[1:]
                if base_type == 'text':
                    type_str = 'TEXT[]'
                elif base_type == 'int4':
                    type_str = 'INTEGER[]'
                else:
                    type_str = f'{base_type.upper()}[]'
            elif format_type == 'inet':
                type_str = 'INET'
            elif format_type == 'ingredient_category':
                type_str = 'ingredient_category'
            else:
                type_str = data_type.upper() if data_type else format_type.upper()
            
            # NULL 허용 여부
            nullable = 'nullable' in options
            null_str = '' if nullable else ' NOT NULL'
            
            # 기본값
            default_str = ''
            if default_value:
                default_str = f' DEFAULT {default_value}'
            
            # UNIQUE
            unique_str = ''
            if 'unique' in options:
                unique_str = ' UNIQUE'
            
            # PRIMARY KEY는 별도로 처리
            pk_str = ''
            if col_name in primary_keys:
                pk_str = ' PRIMARY KEY'
            
            col_def = f"  {col_name} {type_str}{null_str}{unique_str}{default_str}{pk_str}"
            if comment_col:
                col_def += f"  -- {comment_col}"
            
            column_defs.append(col_def)
        
        ddl_parts.append(',\n'.join(column_defs))
        ddl_parts.append(");")
        
        if comment:
            ddl_parts.append(f"COMMENT ON TABLE {schema}.{name} IS '{comment}';")
        
        ddl_parts.append("")
    
    # 외래키 관계
    ddl_parts.append("-- ============================================")
    ddl_parts.append("-- 외래키 관계")
    ddl_parts.append("-- ============================================")
    ddl_parts.append("")
    
    for table in tables_data:
        schema = table.get('schema', 'public')
        name = table.get('name')
        foreign_keys = table.get('foreign_key_constraints', [])
        
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
                
                # ON DELETE 동작 추론 (일반적으로 CASCADE 또는 SET NULL)
                on_delete = 'ON DELETE CASCADE'
                if 'SET NULL' in str(table.get('comment', '')):
                    on_delete = 'ON DELETE SET NULL'
                
                ddl_parts.append(
                    f"ALTER TABLE {schema}.{source_table} "
                    f"ADD CONSTRAINT {fk_name} "
                    f"FOREIGN KEY ({source_col}) "
                    f"REFERENCES {schema}.{target_table}({target_col}) {on_delete};"
                )
    
    return '\n'.join(ddl_parts)


if __name__ == '__main__':
    print("이 스크립트는 Supabase MCP 응답 데이터를 기반으로 DDL을 생성합니다.")
    print("실제 사용 시에는 MCP 응답을 JSON 파일로 저장하여 사용하세요.")
    print("\n사용법:")
    print("1. Supabase MCP에서 list_tables 응답을 JSON 파일로 저장")
    print("2. 이 스크립트를 수정하여 JSON 파일을 읽도록 설정")
    print("3. 스크립트 실행하여 DDL 생성")

