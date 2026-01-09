import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { UpdateTemplateInput, ExportTemplate } from '@/types/exportTemplate';

/**
 * GET /api/export-templates/[id]
 * Get a single export template by ID
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const { data: template, error } = await supabase
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
            .eq('id', id)
            .single();

        if (error || !template) {
            return NextResponse.json(
                { error: 'Template not found' },
                { status: 404 }
            );
        }

        const formattedTemplate: ExportTemplate = {
            id: template.id,
            name: template.name,
            description: template.description,
            isDefault: template.is_default,
            createdAt: template.created_at,
            updatedAt: template.updated_at,
            config: template.config,
            createdBy: {
                id: (template.user as any).id,
                name: (template.user as any).name,
                email: (template.user as any).email
            }
        };

        return NextResponse.json(formattedTemplate);
    } catch (error) {
        console.error('Error in GET /api/export-templates/[id]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/export-templates/[id]
 * Update an export template (Assigner/Admin only, must be creator or admin)
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is Assigner or Admin
        if (session.user.role !== 'ASSIGNER' && session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Only Assigners and Admins can update templates' },
                { status: 403 }
            );
        }

        const { id } = await params;
        const body: UpdateTemplateInput = await request.json();

        // Fetch existing template
        const { data: existingTemplate, error: fetchError } = await supabase
            .from('export_templates')
            .select('created_by')
            .eq('id', id)
            .single();

        if (fetchError || !existingTemplate) {
            return NextResponse.json(
                { error: 'Template not found' },
                { status: 404 }
            );
        }

        // Check ownership (must be creator or admin)
        if (
            existingTemplate.created_by !== session.user.id &&
            session.user.role !== 'ADMIN'
        ) {
            return NextResponse.json(
                { error: 'You can only update your own templates' },
                { status: 403 }
            );
        }

        // Check if new name conflicts with existing template
        if (body.name) {
            const { data: nameConflict } = await supabase
                .from('export_templates')
                .select('id')
                .eq('name', body.name)
                .neq('id', id)
                .single();

            if (nameConflict) {
                return NextResponse.json(
                    { error: 'Template name already exists' },
                    { status: 409 }
                );
            }
        }

        // Prepare update data
        const updateData: any = {
            updated_at: new Date().toISOString()
        };

        if (body.name !== undefined) updateData.name = body.name;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.config !== undefined) updateData.config = body.config;
        if (body.isDefault !== undefined) updateData.is_default = body.isDefault;

        // Update template
        const { data: updatedTemplate, error: updateError } = await supabase
            .from('export_templates')
            .update(updateData)
            .eq('id', id)
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

        if (updateError) {
            console.error('Error updating template:', updateError);
            return NextResponse.json(
                { error: 'Failed to update template' },
                { status: 500 }
            );
        }

        const formattedTemplate: ExportTemplate = {
            id: updatedTemplate.id,
            name: updatedTemplate.name,
            description: updatedTemplate.description,
            isDefault: updatedTemplate.is_default,
            createdAt: updatedTemplate.created_at,
            updatedAt: updatedTemplate.updated_at,
            config: updatedTemplate.config,
            createdBy: {
                id: (updatedTemplate.user as any).id,
                name: (updatedTemplate.user as any).name,
                email: (updatedTemplate.user as any).email
            }
        };

        return NextResponse.json(formattedTemplate);
    } catch (error) {
        console.error('Error in PATCH /api/export-templates/[id]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/export-templates/[id]
 * Delete an export template (Assigner/Admin only, must be creator or admin)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is Assigner or Admin
        if (session.user.role !== 'ASSIGNER' && session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Only Assigners and Admins can delete templates' },
                { status: 403 }
            );
        }

        const { id } = await params;

        // Fetch existing template
        const { data: existingTemplate, error: fetchError } = await supabase
            .from('export_templates')
            .select('created_by, is_default, name')
            .eq('id', id)
            .single();

        if (fetchError || !existingTemplate) {
            return NextResponse.json(
                { error: 'Template not found' },
                { status: 404 }
            );
        }

        // Check ownership
        if (
            existingTemplate.created_by !== session.user.id &&
            session.user.role !== 'ADMIN'
        ) {
            return NextResponse.json(
                { error: 'You can only delete your own templates' },
                { status: 403 }
            );
        }

        // Prevent deletion of default template if it's the only one
        if (existingTemplate.is_default) {
            const { count } = await supabase
                .from('export_templates')
                .select('id', { count: 'exact', head: true });

            if (count && count <= 1) {
                return NextResponse.json(
                    { error: 'Cannot delete the only template' },
                    { status: 400 }
                );
            }
        }

        // Delete template
        const { error: deleteError } = await supabase
            .from('export_templates')
            .delete()
            .eq('id', id);

        if (deleteError) {
            console.error('Error deleting template:', deleteError);
            return NextResponse.json(
                { error: 'Failed to delete template' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { message: 'Template deleted successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error in DELETE /api/export-templates/[id]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
