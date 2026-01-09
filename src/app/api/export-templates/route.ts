import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { CreateTemplateInput, ExportTemplate } from '@/types/exportTemplate';

/**
 * GET /api/export-templates
 * Get all export templates
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all templates with creator info
        const { data: templates, error } = await supabase
            .from('export_templates')
            .select(`
                id,
                name,
                description,
                is_default,
                created_at,
                updated_at,
                config,
                created_by,
                user:users!export_templates_created_by_fkey(id, name, email)
            `)
            .order('is_default', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching templates:', error);
            return NextResponse.json(
                { error: 'Failed to fetch templates' },
                { status: 500 }
            );
        }

        // Transform data to match ExportTemplate type
        const formattedTemplates = templates.map((template: any) => ({
            id: template.id,
            name: template.name,
            description: template.description,
            isDefault: template.is_default,
            createdAt: template.created_at,
            updatedAt: template.updated_at,
            config: template.config,
            createdBy: {
                id: template.user.id,
                name: template.user.name,
                email: template.user.email
            }
        }));

        return NextResponse.json({ templates: formattedTemplates });
    } catch (error) {
        console.error('Error in GET /api/export-templates:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/export-templates
 * Create a new export template (Assigner/Admin only)
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is Assigner or Admin
        if (session.user.role !== 'ASSIGNER' && session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Only Assigners and Admins can create templates' },
                { status: 403 }
            );
        }

        const body: CreateTemplateInput = await request.json();

        // Validate required fields
        if (!body.name || !body.config) {
            return NextResponse.json(
                { error: 'Name and config are required' },
                { status: 400 }
            );
        }

        // Validate config structure
        if (!body.config.columns || !Array.isArray(body.config.columns)) {
            return NextResponse.json(
                { error: 'Config must include columns array' },
                { status: 400 }
            );
        }

        // Check if template name already exists
        const { data: existingTemplate } = await supabase
            .from('export_templates')
            .select('id')
            .eq('name', body.name)
            .single();

        if (existingTemplate) {
            return NextResponse.json(
                { error: 'Template name already exists' },
                { status: 409 }
            );
        }

        // Create template
        const { data: newTemplate, error: insertError } = await supabase
            .from('export_templates')
            .insert({
                name: body.name,
                description: body.description || null,
                config: body.config,
                is_default: body.isDefault || false,
                created_by: session.user.id
            })
            .select(`
                id,
                name,
                description,
                is_default,
                created_at,
                updated_at,
                config,
                user:users!export_templates_created_by_fkey(id, name, email)
            `)
            .single();

        if (insertError) {
            console.error('Error creating template:', insertError);
            return NextResponse.json(
                { error: 'Failed to create template' },
                { status: 500 }
            );
        }

        // Format response
        const formattedTemplate: ExportTemplate = {
            id: newTemplate.id,
            name: newTemplate.name,
            description: newTemplate.description,
            isDefault: newTemplate.is_default,
            createdAt: newTemplate.created_at,
            updatedAt: newTemplate.updated_at,
            config: newTemplate.config,
            createdBy: {
                id: (newTemplate.user as any).id,
                name: (newTemplate.user as any).name,
                email: (newTemplate.user as any).email
            }
        };

        return NextResponse.json(formattedTemplate, { status: 201 });
    } catch (error) {
        console.error('Error in POST /api/export-templates:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
